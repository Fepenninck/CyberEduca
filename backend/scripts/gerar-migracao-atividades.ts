import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildCatalog, contentId } from '../prisma/content/catalog';
import { libraryCourses } from '../prisma/content/course-library';
import { SIMULATION_SEEDS } from '../prisma/content/simulations';

const migration = '20261115230000_catalogo_quizzes_simulacoes';
const literal = (value: unknown) => `'${String(value).replace(/'/g, "''")}'`;
const simId = (key: string) => {
  const hash = createHash('sha256').update(`cybereduca-simulation:${key}`).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
};
const catalog = buildCatalog();
const aulas = catalog.courses.flatMap(course => course.aulas);
const quizzes = aulas.map(aula => ({ id: aula.quiz.id, aulaId: aula.id, titulo: aula.quiz.titulo, descricao: aula.quiz.descricao }));
const questions = aulas.flatMap(aula => {
  // A primeira questão antiga pode ter outro ID ou estar vinculada ao quiz arquivado.
  // Um novo ID só será usado se o quiz atual ainda não tiver uma questão na ordem 1.
  const firstId = contentId(`deploy-primeira-questao/${aula.quiz.id}`);
  return [{ ...aula.quiz.questao, id: firstId,
    alternativas: aula.quiz.questao.alternativas.map(alternativa => ({ ...alternativa,
      id: contentId(`deploy-primeira-alternativa/${aula.quiz.id}/${alternativa.ordem}`) })) },
  ...aula.quiz.revisoes].map(questao => ({ ...questao, quizId: aula.quiz.id }));
});
const questionRows = questions.map(({ alternativas: _alternativas, ...questao }) => questao);
const alternatives = questions.flatMap(questao => questao.alternativas.map(alternativa => ({ ...alternativa, questaoId: questao.id })));
const legacy = libraryCourses.flatMap(course => course.lessons.map(lesson => ({
  id: contentId(`quiz/${course.id}/${lesson.id}`), atual: contentId(`pedagogia-v2/${contentId(`${course.id}/${lesson.id}`)}`),
})));
const categories = [...new Set(SIMULATION_SEEDS.map(item => item.categoria))].map(nome => ({
  id: simId(`categoria:${nome}`), nome, descricao: `Situações fictícias para praticar decisões sobre ${nome.toLowerCase()}.`,
}));
const simulations = SIMULATION_SEEDS.map(item => ({ id: simId(item.key), titulo: item.titulo,
  descricao: item.descricao, nivel: item.nivel, duracaoMinutos: item.duracaoMinutos, categoria: item.categoria }));
const simulationQuestions = SIMULATION_SEEDS.flatMap(item => item.decisoes.map((decision, index) => ({
  id: simId(`${item.key}:q:${index}`), simulacaoId: simId(item.key), ordem: index,
  enunciado: decision.enunciado, contexto: decision.contexto, explicacao: decision.explicacao,
})));
const simulationAlternatives = SIMULATION_SEEDS.flatMap((item, simulationIndex) => item.decisoes.flatMap((decision, index) => {
  const values = [decision.correta, ...decision.outras];
  const offset = (index + simulationIndex) % values.length;
  return [...values.slice(offset), ...values.slice(0, offset)].map((texto, ordem) => ({
    id: simId(`${item.key}:q:${index}:a:${ordem}`), questaoId: simId(`${item.key}:q:${index}`), ordem, texto, isCorreta: texto === decision.correta,
  }));
}));
assert.equal(quizzes.length, 91);
assert.equal(questionRows.length, 910);
assert.equal(simulations.length, 12);
assert.equal(simulationQuestions.length, 36);
const records = (values: unknown[], schema: string) => `jsonb_to_recordset(${literal(JSON.stringify(values))}::jsonb) AS src(${schema})`;

const sql = `-- Catálogo aditivo: preserva IDs, edições administrativas, questões antigas e históricos.
-- Executada uma única vez por prisma migrate deploy. Não roda o seed geral.
DO $catalogo_atividades$
DECLARE
  novos_quizzes integer;
  novas_questoes integer;
  novas_simulacoes integer;
  ids_questoes_quiz text[];
  ids_questoes_simulacao text[];
BEGIN
  INSERT INTO "Quiz" (id, "aulaId", titulo, descricao, status, "criadoEm", "atualizadoEm")
  SELECT src.id, src."aulaId", src.titulo, src.descricao, 'PUBLICADO'::"StatusAtividade", now(), now()
  FROM ${records(quizzes, 'id text, "aulaId" text, titulo text, descricao text')}
  JOIN "Aula" a ON a.id = src."aulaId"
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS novos_quizzes = ROW_COUNT;

  WITH inseridas AS (
  INSERT INTO "QuestaoQuiz" (id, "quizId", enunciado, explicacao, ordem)
  SELECT src.id, src."quizId", src.enunciado, src.explicacao, src.ordem
  FROM ${records(questionRows, 'id text, "quizId" text, enunciado text, explicacao text, ordem integer')}
  JOIN "Quiz" q ON q.id = src."quizId"
  WHERE NOT EXISTS (SELECT 1 FROM "QuestaoQuiz" existente WHERE existente."quizId" = q.id AND existente.ordem = src.ordem)
  ON CONFLICT DO NOTHING RETURNING id
  ) SELECT coalesce(array_agg(id), ARRAY[]::text[]), count(*)::integer
    INTO ids_questoes_quiz, novas_questoes FROM inseridas;

  INSERT INTO "AlternativaQuiz" (id, "questaoId", texto, correta, ordem)
  SELECT src.id, src."questaoId", src.texto, src.correta, src.ordem
  FROM ${records(alternatives, 'id text, "questaoId" text, texto text, correta boolean, ordem integer')}
  JOIN "QuestaoQuiz" q ON q.id = src."questaoId"
  WHERE q.id = ANY(ids_questoes_quiz)
  ON CONFLICT DO NOTHING;

  -- Apenas a versão antiga identificada do catálogo é arquivada, e só se a nova estiver completa e publicada.
  UPDATE "Quiz" antigo SET status = 'ARQUIVADO'::"StatusAtividade"
  FROM ${records(legacy, 'id text, atual text')}
  JOIN "Quiz" atual ON atual.id = src.atual AND atual.status = 'PUBLICADO'::"StatusAtividade"
  WHERE antigo.id = src.id AND antigo.status = 'PUBLICADO'::"StatusAtividade"
    AND (SELECT count(*) FROM "QuestaoQuiz" q WHERE q."quizId" = atual.id) >= 10;

  INSERT INTO "CenarioPhishing" (id, titulo, descricao, "conteudoMensagem", tipo, "ehPhishing", explicacao, "aulaId", status, "criadoEm", "atualizadoEm")
  SELECT src.id, src.titulo, src.descricao, src."conteudoMensagem", src.tipo::"TipoCenarioPhishing", src."ehPhishing", src.explicacao, src."aulaId", 'PUBLICADO'::"StatusAtividade", now(), now()
  FROM ${records(catalog.cenarios, 'id text, titulo text, descricao text, "conteudoMensagem" text, tipo text, "ehPhishing" boolean, explicacao text, "aulaId" text')}
  JOIN "Aula" a ON a.id = src."aulaId"
  ON CONFLICT DO NOTHING;

  INSERT INTO "CategoriaSimulacao" (id, nome, descricao, "criadoEm")
  SELECT src.id, src.nome, src.descricao, now()
  FROM ${records(categories, 'id text, nome text, descricao text')}
  ON CONFLICT DO NOTHING;

  INSERT INTO "Simulacao" (id, titulo, descricao, nivel, "duracaoMinutos", "categoriaId", "criadoEm")
  SELECT src.id, src.titulo, src.descricao, src.nivel::"NivelTrilha", src."duracaoMinutos", categoria.id, now()
  FROM ${records(simulations, 'id text, titulo text, descricao text, nivel text, "duracaoMinutos" integer, categoria text')}
  JOIN "CategoriaSimulacao" categoria ON categoria.nome = src.categoria
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS novas_simulacoes = ROW_COUNT;

  WITH inseridas AS (
  INSERT INTO "QuestaoSimulacao" (id, "simulacaoId", ordem, enunciado, contexto, explicacao)
  SELECT src.id, src."simulacaoId", src.ordem, src.enunciado, src.contexto, src.explicacao
  FROM ${records(simulationQuestions, 'id text, "simulacaoId" text, ordem integer, enunciado text, contexto text, explicacao text')}
  JOIN "Simulacao" simulacao ON simulacao.id = src."simulacaoId"
  WHERE NOT EXISTS (SELECT 1 FROM "QuestaoSimulacao" existente WHERE existente."simulacaoId" = simulacao.id AND existente.ordem = src.ordem)
  ON CONFLICT DO NOTHING RETURNING id
  ) SELECT coalesce(array_agg(id), ARRAY[]::text[]) INTO ids_questoes_simulacao FROM inseridas;

  INSERT INTO "AlternativaSimulacao" (id, "questaoId", ordem, texto, "isCorreta")
  SELECT src.id, src."questaoId", src.ordem, src.texto, src."isCorreta"
  FROM ${records(simulationAlternatives, 'id text, "questaoId" text, ordem integer, texto text, "isCorreta" boolean')}
  JOIN "QuestaoSimulacao" q ON q.id = src."questaoId"
  WHERE q.id = ANY(ids_questoes_simulacao)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Catálogo atualizado: % quizzes, % questões de quiz e % simulações adicionados. Históricos preservados.', novos_quizzes, novas_questoes, novas_simulacoes;
END
$catalogo_atividades$;
`;
const dir = resolve(__dirname, '../prisma/migrations', migration);
if (process.argv.includes('--write')) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'migration.sql'), sql, 'utf8');
  console.log(`${migration}: 91 quizzes, 910 questões, 12 simulações e 12 cenários de phishing.`);
} else {
  assert.equal(readFileSync(resolve(dir, 'migration.sql'), 'utf8').replace(/\r\n/g, '\n'), sql.replace(/\r\n/g, '\n'));
  console.log('Migração de atividades corresponde ao catálogo versionado.');
}
