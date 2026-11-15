import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { buildCatalog } from '../prisma/content/catalog';
import { boasVindas } from '../prisma/content/boas-vindas';

const nome = '20261115223000_revisao_editorial_aulas';
const dir = resolve(__dirname, '../prisma/migrations', nome);
const literal = (value: string) => `'${value.replace(/'/g, "''")}'`;
const aulas = buildCatalog().courses.flatMap(course => course.aulas);
assert.equal(aulas.length, 91);
const values = aulas.map(aula => {
  const material = JSON.parse(aula.conteudo);
  const patch = {
    concept: material.concept,
    caseStudy: material.caseStudy,
    practice: material.practice,
    takeaway: material.takeaway,
  };
  assert.ok(Object.values(patch).every(value => typeof value === 'string' && value.length > 0));
  return `    (${literal(aula.id)}, ${literal(JSON.stringify(patch))}::jsonb)`;
});
const sql = `-- Revisão editorial versionada: textos das aulas e boas-vindas.
-- Não cria/exclui aulas e não altera usuários, mídias, questões ou históricos.
-- Banco vazio também é válido: o seed já contém os textos revisados.
DO $revisao_editorial$
DECLARE
  atualizadas integer;
  introducoes integer;
BEGIN
  UPDATE "Aula" AS a
  SET "conteudo" = (a."conteudo"::jsonb || revisao.patch)::text
  FROM (VALUES
${values.join(',\n')}
  ) AS revisao(id, patch)
  WHERE a.id = revisao.id;
  GET DIAGNOSTICS atualizadas = ROW_COUNT;

  UPDATE "Aula"
  SET "conteudo" = ${literal(boasVindas)}
  WHERE id = 'b1a2c3d4-1111-2222-3333-444444444441';
  GET DIAGNOSTICS introducoes = ROW_COUNT;
  RAISE NOTICE 'Revisão editorial: % aulas e % introdução atualizadas; mídias e históricos preservados.', atualizadas, introducoes;
END
$revisao_editorial$;
`;

if (process.argv.includes('--write')) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'migration.sql'), sql, 'utf8');
  console.log(`Migração editorial gerada: ${nome}; ${aulas.length} aulas e introdução.`);
} else {
  assert.equal(readFileSync(resolve(dir, 'migration.sql'), 'utf8').replace(/\r\n/g, '\n'), sql.replace(/\r\n/g, '\n'),
    'A migração não corresponde à revisão editorial versionada. Não altere uma migração já publicada.');
  console.log('Migração editorial corresponde aos textos e à introdução revisados.');
}
