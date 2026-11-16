// Somente conteúdo didático. Usuários, credenciais, tentativas e auditoria ficam fora.
const tables = [
  { table: 'Trilha', columns: ['id', 'titulo', 'descricao', 'nivel', 'bloqueada', 'ordem'] },
  { table: 'CategoriaSimulacao', columns: ['id', 'nome', 'descricao', 'criadoEm'], natural: ['nome'] },
  { table: 'Aula', columns: ['id', 'titulo', 'conteudo', 'ordem', 'trilhaId'], parents: { trilhaId: 'Trilha' }, natural: ['trilhaId', 'ordem'] },
  { table: 'Prova', columns: ['id', 'titulo', 'descricao', 'trilhaId', 'status', 'criadoEm', 'atualizadoEm'], parents: { trilhaId: 'Trilha' } },
  { table: 'Quiz', columns: ['id', 'titulo', 'descricao', 'aulaId', 'status', 'criadoEm', 'atualizadoEm'], parents: { aulaId: 'Aula' } },
  { table: 'Simulacao', columns: ['id', 'titulo', 'descricao', 'nivel', 'duracaoMinutos', 'categoriaId', 'criadoEm'], parents: { categoriaId: 'CategoriaSimulacao' } },
  { table: 'CenarioPhishing', columns: ['id', 'titulo', 'descricao', 'conteudoMensagem', 'tipo', 'ehPhishing', 'explicacao', 'aulaId', 'status', 'criadoEm', 'atualizadoEm'], parents: { aulaId: 'Aula' } },
  { table: 'QuestaoProva', columns: ['id', 'enunciado', 'explicacao', 'ordem', 'tipo', 'provaId'], parents: { provaId: 'Prova' }, natural: ['provaId', 'ordem'] },
  { table: 'AlternativaProva', columns: ['id', 'texto', 'correta', 'ordem', 'questaoId'], parents: { questaoId: 'QuestaoProva' }, natural: ['questaoId', 'ordem'] },
  { table: 'QuestaoQuiz', columns: ['id', 'quizId', 'enunciado', 'explicacao', 'ordem'], parents: { quizId: 'Quiz' }, natural: ['quizId', 'ordem'] },
  { table: 'AlternativaQuiz', columns: ['id', 'questaoId', 'texto', 'correta', 'ordem'], parents: { questaoId: 'QuestaoQuiz' }, natural: ['questaoId', 'ordem'] },
  { table: 'QuestaoSimulacao', columns: ['id', 'enunciado', 'contexto', 'explicacao', 'ordem', 'simulacaoId'], parents: { simulacaoId: 'Simulacao' }, natural: ['simulacaoId', 'ordem'] },
  { table: 'AlternativaSimulacao', columns: ['id', 'texto', 'ordem', 'isCorreta', 'questaoId'], parents: { questaoId: 'QuestaoSimulacao' }, natural: ['questaoId', 'ordem'] },
];

async function snapshotCatalog(tx) {
  const snapshots = [];
  for (const spec of tables) {
    const fields = spec.columns.map(column => `"${column}"`).join(', ');
    const rows = await tx.$queryRawUnsafe(`SELECT row_to_json(r) AS registro FROM (SELECT ${fields} FROM "${spec.table}" ORDER BY id) r`);
    snapshots.push({ ...spec, rows: rows.map(row => row.registro) });
  }
  return snapshots;
}

module.exports = { tables, snapshotCatalog };
