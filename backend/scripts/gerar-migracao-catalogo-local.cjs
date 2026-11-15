const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { tables } = require('./snapshot-catalogo.cjs');
const snapshot = require('../prisma/content/catalogo-local-20261115.json');
assert.deepEqual(snapshot.tables.map(({ rows: _rows, ...spec }) => spec), tables);
for (const spec of snapshot.tables) {
  assert.equal(new Set(spec.rows.map(row => row.id)).size, spec.rows.length);
  assert.ok(spec.rows.every(row => Object.keys(row).every(key => spec.columns.includes(key))));
}
const literal = value => `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
const sql = `-- Snapshot do catálogo local, autorizado para publicação. Sem usuários ou históricos.
-- Atualiza conteúdo e completa registros ausentes. Não exclui dados de produção.
-- IDs já usados em produção são preservados quando a chave funcional identifica o mesmo item.
DO $catalogo_local$
DECLARE
  spec jsonb;
  item jsonb;
  payload jsonb;
  entidade text;
  origem text;
  destino text;
  primario text;
  natural_id text;
  candidatos integer;
  pai record;
  pai_id text;
  nomes text;
  valores text;
  atualizacoes text;
  condicao text;
  mapa record;
  contador integer;
BEGIN
  CREATE TEMP TABLE _catalogo_local_ids (
    entidade text NOT NULL, origem text NOT NULL, destino text NOT NULL,
    PRIMARY KEY (entidade, origem)
  ) ON COMMIT DROP;

  FOR spec IN SELECT value FROM jsonb_array_elements(${literal(snapshot.tables)}) LOOP
    entidade := spec->>'table';
    contador := 0;
    SELECT string_agg(format('%I', value), ', '), string_agg(format('r.%I', value), ', ')
      INTO nomes, valores FROM jsonb_array_elements_text(spec->'columns');
    SELECT string_agg(format('%I = EXCLUDED.%I', value, value), ', ')
      INTO atualizacoes FROM jsonb_array_elements_text(spec->'columns')
      WHERE value NOT IN ('id', 'criadoEm');

    FOR item IN SELECT value FROM jsonb_array_elements(spec->'rows') LOOP
      payload := item;
      origem := item->>'id';
      FOR pai IN SELECT key, value FROM jsonb_each_text(coalesce(spec->'parents', '{}'::jsonb)) LOOP
        SELECT ids.destino INTO pai_id FROM _catalogo_local_ids ids
          WHERE ids.entidade = pai.value AND ids.origem = item->>pai.key;
        IF pai_id IS NULL THEN RAISE EXCEPTION 'Referência de catálogo ausente: % em %.', pai.key, entidade; END IF;
        payload := jsonb_set(payload, ARRAY[pai.key], to_jsonb(pai_id));
      END LOOP;

      EXECUTE format('SELECT id FROM %I WHERE id = $1', entidade) INTO primario USING origem;
      natural_id := NULL;
      IF jsonb_array_length(coalesce(spec->'natural', '[]'::jsonb)) > 0 THEN
        SELECT string_agg(format('t.%I IS NOT DISTINCT FROM r.%I', value, value), ' AND ')
          INTO condicao FROM jsonb_array_elements_text(spec->'natural');
        EXECUTE format('SELECT count(*)::integer, min(t.id) FROM %I t CROSS JOIN jsonb_populate_record(NULL::%I, $1) r WHERE %s', entidade, entidade, condicao)
          INTO candidatos, natural_id USING payload;
        IF candidatos > 1 THEN RAISE EXCEPTION 'Chave funcional ambígua em %. Nenhum dado foi excluído.', entidade; END IF;
        IF primario IS NOT NULL AND natural_id IS NOT NULL AND primario <> natural_id THEN
          RAISE EXCEPTION 'Conflito entre ID e posição em %. A sincronização foi revertida.', entidade;
        END IF;
      END IF;
      destino := coalesce(primario, natural_id, origem);
      payload := jsonb_set(payload, '{id}', to_jsonb(destino));

      IF entidade = 'QuestaoProva' THEN
        FOR mapa IN SELECT ids.origem, ids.destino FROM _catalogo_local_ids ids WHERE ids.entidade = 'Aula' AND ids.origem <> ids.destino LOOP
          payload := jsonb_set(payload, '{explicacao}', to_jsonb(replace(payload->>'explicacao', '[aula:' || mapa.origem || ']', '[aula:' || mapa.destino || ']')));
        END LOOP;
      END IF;
      EXECUTE format('INSERT INTO %I (%s) SELECT %s FROM jsonb_populate_record(NULL::%I, $1) r ON CONFLICT (id) DO UPDATE SET %s',
        entidade, nomes, valores, entidade, atualizacoes) USING payload;
      INSERT INTO _catalogo_local_ids VALUES (entidade, origem, destino);
      contador := contador + 1;
    END LOOP;
    RAISE NOTICE 'Catálogo local: % registros sincronizados em %.', contador, entidade;
  END LOOP;
END
$catalogo_local$;
`;
const dir = path.resolve(__dirname, '../prisma/migrations/20261115235000_sincronizar_catalogo_local');
if (process.argv.includes('--write')) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'migration.sql'), sql);
  console.log('Migração do snapshot local gerada, sem usuários, credenciais ou exclusões.');
} else {
  assert.equal(fs.readFileSync(path.join(dir, 'migration.sql'), 'utf8').replace(/\r\n/g, '\n'), sql.replace(/\r\n/g, '\n'));
  console.log('Migração corresponde ao snapshot local.');
}
