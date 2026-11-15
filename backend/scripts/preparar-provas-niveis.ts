import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { certificationLessons } from '../prisma/content/certification-variants';
import { contentId } from '../prisma/content/catalog';
import { EXAM_IDS, LEVELS, RETIRED_TRACK } from '../src/certificacoes/certification-progress';

const prisma = new PrismaClient();
const apply = process.argv.includes('--apply');
const title = { BASICO: 'Básico', INTERMEDIARIO: 'Intermediário', AVANCADO: 'Avançado' };
const introVariants = [
 ['Qual é um objetivo dos cuidados de segurança apresentados na introdução?', 'Proteger dados e credenciais e reconhecer pedidos suspeitos.', 'Eliminar a necessidade de verificar qualquer mensagem.', 'A trilha apresenta proteção de informações, credenciais e reconhecimento de riscos.'],
 ['Um formulário de material gratuito pede endereço e documento para enviar um arquivo por e-mail. Como avaliar?', 'Questionar os dados que não parecem necessários para a finalidade.', 'Enviar todas as informações sem verificar a necessidade.', 'A coleta deve fazer sentido para a finalidade e não exigir dados desnecessários.'],
 ['O modo de navegação privada impede que sites e a rede observem qualquer atividade?', 'Não; esse modo não torna toda a navegação invisível.', 'Sim; nenhum serviço consegue observar qualquer informação.', 'A navegação privada tem limites e não elimina a necessidade de revisar registros e preferências.'],
 ['Uma fotografia mostra uma etiqueta com endereço ao fundo. O público restrito elimina todo risco?', 'Não; é melhor retirar o dado antes de compartilhar e revisar o público.', 'Sim; pessoas conhecidas nunca fazem cópias de imagens.', 'Reduzir público ajuda, mas não impede cópias nem substitui retirar dados desnecessários.'],
 ['Um editor de fotos pede acesso aos contatos. Qual é o cuidado adequado?', 'Comparar a permissão com a função e negar acessos sem justificativa.', 'Permitir qualquer acesso porque o aplicativo já foi instalado.', 'Permissões devem acompanhar a função utilizada, com o menor acesso necessário.'],
 ['Ao ler uma política de privacidade, quais informações ajudam a decidir sobre um serviço?', 'Os dados coletados, suas finalidades e com quem são compartilhados.', 'Somente a cor da página e o tamanho do logotipo.', 'Um plano de privacidade considera o que se entrega, para quem e com qual finalidade.'],
];

async function main() {
 const lessons = await prisma.aula.findMany({ where: { trilhaId: { not: RETIRED_TRACK } }, orderBy: [{ trilha: { ordem: 'asc' } }, { ordem: 'asc' }], include: { trilha: true } });
 const bank = certificationLessons();
 const introductory = lessons.filter(lesson => lesson.trilhaId === 'cd24b773-00b6-4750-9e38-c1a332554275');
 if (introductory.length !== 6) throw new Error('Confira as seis aulas introdutórias antes de preparar as provas.');
 for (const [index, lesson] of introductory.entries()) {
  const [enunciado, correta, incorreta, explicacao] = introVariants[index];
  const variant = { enunciado, explicacao, alternativas: [{ texto: correta, isCorreta: true }, { texto: incorreta, isCorreta: false }] };
  const content = (() => { try { return JSON.parse(lesson.conteudo); } catch { return null; } })();
  const checkpoint = content?.introductory?.checkpoint;
  const original = checkpoint ? { enunciado: checkpoint.question as string, explicacao: checkpoint.explanation as string, alternativas: (checkpoint.options as string[]).map((texto, i) => ({ texto, isCorreta: i === checkpoint.correct })) } : { enunciado: 'Ao receber uma mensagem que pede uma senha com urgência, qual postura corresponde à introdução da trilha?', explicacao: 'A introdução apresenta proteção de credenciais e reconhecimento de engenharia social.', alternativas: [{ texto: 'Verificar a origem por um canal confiável antes de agir e não entregar a senha.', isCorreta: true }, { texto: 'Entregar a senha porque todo pedido urgente é legítimo.', isCorreta: false }] };
  bank.push({ aulaId: lesson.id, nivel: lesson.trilha.nivel, titulo: lesson.titulo, questoes: [original, variant] });
 }
 if (bank.length !== lessons.length || new Set(bank.map(item => item.aulaId)).size !== lessons.length || lessons.some(lesson => !bank.some(item => item.aulaId === lesson.id && item.nivel === lesson.trilha.nivel))) throw new Error('O banco de questões não cobre exatamente o catálogo atual. Nenhuma alteração realizada.');
 for (const item of bank) {
  if (item.questoes.length < 2 || new Set(item.questoes.map(question => question.enunciado)).size !== item.questoes.length || item.questoes.some(question => question.alternativas.length < 2 || question.alternativas.filter(answer => answer.isCorreta).length !== 1)) throw new Error(`Questões inválidas: ${item.titulo}`);
 }
 const ids = bank.flatMap(item => item.questoes.map((_, index) => contentId(`certification-bank-v1/${item.aulaId}/${index}`)));
 const existing = await prisma.questaoProva.count({ where: { id: { in: ids } } });
 console.log(JSON.stringify({ modo: apply ? 'aplicar' : 'simular', aulas: lessons.length, questoesNoBanco: ids.length, novasQuestoes: ids.length - existing, niveis: LEVELS.map(nivel => ({ nivel, questoesPorProva: bank.filter(item => item.nivel === nivel).length })) }));
 if (!apply) return;
 await prisma.$transaction(async tx => {
  const attemptsBefore = await tx.tentativaProva.count();
  const answersBefore = await tx.respostaProva.count();
  for (const nivel of LEVELS) {
   const first = lessons.find(lesson => lesson.trilha.nivel === nivel)!;
   await tx.prova.upsert({ where: { id: EXAM_IDS[nivel] }, update: {}, create: { id: EXAM_IDS[nivel], titulo: `Prova final - Nível ${title[nivel].toLowerCase()}`, descricao: 'Uma questão de cada aula do nível. Aprovação com 60% de acertos. Novas questões e espera de 24 horas após reprovação.', trilhaId: first.trilhaId, status: 'PUBLICADO' } });
   let order = 0;
   for (const item of bank.filter(entry => entry.nivel === nivel)) for (const [variantIndex, question] of item.questoes.entries()) {
    const id = contentId(`certification-bank-v1/${item.aulaId}/${variantIndex}`);
    const offset = order % question.alternativas.length;
    const alternatives = [...question.alternativas.slice(offset), ...question.alternativas.slice(0, offset)];
    await tx.questaoProva.upsert({ where: { id }, update: {}, create: { id, provaId: EXAM_IDS[nivel], ordem: ++order, enunciado: question.enunciado, explicacao: `[aula:${item.aulaId}] ${question.explicacao}\nAula de referência: ${item.titulo}.`, alternativas: { create: alternatives.map((answer, index) => ({ id: contentId(`${id}/alternativa/${index}`), ...answer, ordem: index + 1 })) } } });
   }
  }
  if (await tx.tentativaProva.count() !== attemptsBefore || await tx.respostaProva.count() !== answersBefore) throw new Error('O histórico precisa permanecer inalterado.');
 }, { timeout: 60000 });
 console.log('Provas por nível preparadas sem excluir questões, resultados ou tentativas anteriores.');
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'Falha ao preparar provas.'); process.exitCode = 1; }).finally(() => prisma.$disconnect());
