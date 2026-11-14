// Trechos de leitura, não executados pelo aluno. Cada posição corresponde a uma aula.
const code: Record<string, string[]> = {
  acesso: [
    'const usuario = exigirSessao();\nif (!politica.permite(usuario, "editar-aula")) return resposta(403);\nreturn editarAulaComEscopo(usuario, dados);',
    'const documento = await buscarDocumento(id);\nif (documento.donoId !== usuario.id) return resposta(403);\nreturn { titulo: documento.titulo };',
    'const permissoes = new Set(); // Sem regras, nenhuma operacao permitida.\nif (!permissoes.has(operacao)) return resposta(403);',
    'const podeEditar = usuario.papel === "INSTRUTOR"\n  && aula.instrutorId === usuario.id\n  && aula.status === "RASCUNHO";',
    'const documento = await db.documento.findFirst({\n  where: { id, organizacaoId: sessao.organizacaoId }\n});\nif (!documento) return resposta(404);',
    'if (sessao.revogada || sessao.expiraEm <= agora) return resposta(401);\n// A verificacao ocorre antes de usar as permissoes da sessao.',
    'const casos = [\n  ["proprietario", 200], ["outro usuario", 403], ["sem sessao", 401]\n];\n// Verificar tambem que uma negacao nao altera o documento.',
    'if (link.expiraEm <= agora || link.usuarioId !== sessao.usuarioId)\n  return resposta(403);\nreturn transmitirArquivoAutorizado(link.arquivoId);',
    'const limite = Math.min(validarInteiro(pedido.limite), 100);\nreturn listarDocumentos({ donoId: usuario.id, limite });\n// Limitar volume nao substitui filtrar os recursos autorizados.',
    'const matriz = {\n  aluno: ["ler-publicadas"],\n  instrutor: ["editar-proprias"],\n  admin: ["gerenciar-conteudo"]\n};\n// Conferir a politica em cada rota e em cada recurso.',
  ],
  configuracao: [
    'const producao = { debugPublico: false, servicosExtras: [] };\nif (producao.debugPublico) throw new Error("Publicacao bloqueada");',
    '// Executado no servidor, nunca enviado ao navegador:\nconst chave = process.env.CHAVE_PROVEDOR;\nif (!chave) throw new Error("Credencial ausente");',
    'const dependencia = { nome: "pacote-ficticio", versao: "1.2.3",\n  origem: "registro-oficial", revisada: true };\n// Confirmar nome, procedencia e necessidade antes da adocao.',
    'const ambientes = {\n  teste: { banco: "dados-sinteticos", segredo: "cofre-teste" },\n  producao: { banco: "dados-reais", segredo: "cofre-producao" }\n};',
    'await atualizarConsumidores("REFERENCIA_NOVA");\nawait validarIntegracoes();\nawait revogarCredencial("REFERENCIA_ANTIGA");\n// A sequencia depende da urgencia e dos recursos do provedor.',
    '{\n  "componente": "biblioteca-ficticia",\n  "versao": "1.2.3",\n  "origem": "registro-controlado",\n  "dependencias": ["componente-transitivo"]\n}',
    'const etapas = ["revisao", "testes", "verificacao-dependencias", "build"];\nif (!etapas.every(etapa => resultados[etapa] === "aprovado"))\n  throw new Error("Artefato nao liberado");',
    'const liberacao = { semSegredosNoCliente: true, debugDesligado: true,\n  versoesRevisadas: true, recuperacaoPlanejada: true };\nconst publicar = Object.values(liberacao).every(Boolean);',
  ],
  desenvolvimento: [
    '// Entrada permanece como valor, nao vira parte da instrucao:\nconst comando = "SELECT titulo FROM Aula WHERE id = ?";\nconst parametros = [entradaValidada];',
    '// O mesmo dado exige cuidado conforme o contexto:\nconst texto = <p>{mensagem}</p>;\n// Um endereco de link ainda precisa de validacao propria.',
    'const fronteiras = [\n  { origem: "navegador", destino: "API", controle: "validar e autorizar" },\n  { origem: "API", destino: "banco", controle: "parametros e privilegios" }\n];',
    'const sql = "SELECT titulo FROM Aula WHERE id = ? AND organizacaoId = ?";\nawait banco.consultar(sql, [idValidado, sessao.organizacaoId]);\n// A forma de vincular parametros depende do driver.',
    'const mensagemFicticia = "<script>exemplo</script>";\nreturn <pre>{mensagemFicticia}</pre>;\n// React exibe a sequencia como texto; nao usar HTML bruto.',
    'if (!Number.isInteger(dados.ordem) || dados.ordem < 1)\n  return resposta(400);\nif (dados.titulo.length > 120) return resposta(400);\n// Depois do formato, conferir a permissao e a regra do dominio.',
    'await banco.transacao(async tx => {\n  const anterior = await tx.buscarResultado(usuario.id, chaveRepeticao);\n  if (anterior) return anterior;\n  return tx.executarERegistrar(usuario.id, chaveRepeticao);\n});\n// Requer unicidade no banco para pedidos concorrentes.',
    'const ameaca = { entrada: "id fornecido pelo cliente",\n  risco: "leitura de outra organizacao",\n  requisito: "filtrar por organizacao autenticada",\n  teste: "negar acesso cruzado sem retornar dados" };',
    'const revisaoAPI = [\n  "sessao valida", "acesso ao objeto", "formato da entrada",\n  "consulta parametrizada", "campos de resposta limitados"\n];\n// Cada item precisa de um caso permitido e outro negado.',
  ],
  deteccao: [
    '{ "horario": "2026-01-01T10:00:00Z", "acao": "LOGIN",\n  "resultado": "NEGADO", "correlacao": "req-ficticia-1" }\n// Sem senha, cookie ou token.',
    'const incidentes = [\n  { ativo: "servico publico", dadosExpostos: true, prioridade: "alta" },\n  { ativo: "laboratorio isolado", dadosExpostos: false, prioridade: "avaliar" }\n];\n// Justificar a prioridade pelo impacto e pelo contexto.',
    'const preparacao = { responsavel: "equipe-ficticia",\n  contatoAlternativo: "canal-independente",\n  recuperacao: "procedimento-validado" };\n// O contato alternativo nao pode depender do servico indisponivel.',
    '{ "horarioUTC": "2026-01-01T10:00:00Z",\n  "correlacao": "req-ficticia-2", "acao": "ALTERAR", "resultado": "NEGADO" }\n// Correlacao relaciona eventos; horarios precisam ser interpretaveis.',
    'const alerta = falhasRecentes >= 5;\nif (alerta) abrirTriagem({ conta: "conta-ficticia", contexto });\n// A regra sinaliza uma suspeita, nao comprova a causa.',
    'const linhaDoTempo = [\n  { instante: "10:00Z", fato: "alerta recebido" },\n  { instante: "10:03Z", fato: "acesso suspenso" }\n];\n// Preservar origem, horarios e integridade dos registros.',
    'const retornoSeguro = causaTratada && acessosRevisados\n  && restauracaoValidada && monitoramentoAtivo;\n// Abrir a pagina inicial nao comprova recuperacao completa.',
    'const plano = { riscos: [], controles: [], alertas: [],\n  responsaveis: [], comunicacao: [], recuperacao: [] };\n// Relacionar cada risco a um controle e a uma verificacao concreta.',
  ],
};

export function technicalExample(courseId: string, index: number): string {
  const snippet = code[courseId.replace('biblioteca-', '')]?.[index];
  if (!snippet) throw new Error(`Exemplo técnico ausente: ${courseId}/${index}`);
  return ['### Exemplo técnico desta aula', '', '```', snippet, '```', '', 'Exemplo didático para leitura nesta página; não é executado nem exige ferramentas externas.'].join('\n');
}
