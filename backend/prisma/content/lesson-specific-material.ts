// Um fluxo por aula, na mesma ordem dos IDs estáveis do catálogo.
const flows: Record<string, [string, string, string][]> = {
  redes: [
    ['Painel do roteador', 'Credencial administrativa', 'Alterações autorizadas'],
    ['Rede de visitantes', 'Regras de separação', 'Recursos internos'],
    ['Rede compartilhada', 'Identidade do destino', 'Avisos da conexão'],
    ['Endereço IP', 'Porta do serviço', 'Protocolo utilizado'],
    ['Nome consultado', 'Resposta DNS', 'Destino da conexão'],
    ['Certificado apresentado', 'Validação TLS', 'Conexão protegida'],
    ['Necessidade de acesso', 'Regra do firewall', 'Comunicação permitida'],
    ['Registro de rede', 'Origem e destino', 'Interpretação do evento'],
  ],
  privacidade: [
    ['Finalidade do cadastro', 'Dados necessários', 'Coleta reduzida'],
    ['Documento interno', 'Destinatários definidos', 'Permissões limitadas'],
    ['Perfis e publicações', 'Público de cada dado', 'Exposição acumulada'],
    ['Tipo de informação', 'Pessoas autorizadas', 'Uso e armazenamento'],
    ['Prazo de retenção', 'Fim da necessidade', 'Descarte verificável'],
    ['Imagem compartilhada', 'Metadados presentes', 'Informações reveladas'],
    ['Relatório fictício', 'Conteúdo indispensável', 'Compartilhamento restrito'],
  ],
  malware: [
    ['Comportamento estranho', 'Outras causas possíveis', 'Investigação do alerta'],
    ['Anexo inesperado', 'Confirmação da origem', 'Decisão sobre abertura'],
    ['Permissões do programa', 'Alcance das alterações', 'Limitação do impacto'],
    ['Arquivos bloqueados', 'Dependências afetadas', 'Plano de recuperação'],
    ['Alerta do dispositivo', 'Contexto observado', 'Triagem responsável'],
    ['Suspeita de infecção', 'Contenção coordenada', 'Evidências preservadas'],
    ['Instalador recebido', 'Origem e integridade', 'Verificação do fornecedor'],
    ['Estação comprometida', 'Escopo do incidente', 'Decisões de resposta'],
  ],
  'remoto-ia': [
    ['Ambiente compartilhado', 'Tela e documentos', 'Exposição física'],
    ['Pedido de suporte', 'Chamado confirmado', 'Acesso autorizado'],
    ['Texto enviado à IA', 'Dados retirados', 'Resposta revisada'],
    ['Acesso remoto', 'Identidade verificada', 'Escopo da conexão'],
    ['Documento consultado', 'Instrução indevida', 'Limite da tarefa'],
    ['Rotina de trabalho', 'Regras de uso', 'Revisão das escolhas'],
  ],
  acesso: [
    ['Identidade autenticada', 'Permissão da operação', 'Decisão no servidor'],
    ['ID do documento', 'Proprietário e relação', 'Campos autorizados'],
    ['Operação nova', 'Negação inicial', 'Permissão explícita'],
    ['Papel do usuário', 'Atributos do recurso', 'Política de acesso'],
    ['Organização da sessão', 'Organização do objeto', 'Isolamento do tenant'],
    ['Sessão emitida', 'Expiração ou revogação', 'Revalidação do acesso'],
    ['Cenário de teste', 'Resposta esperada', 'Efeitos colaterais'],
    ['Export solicitado', 'Escopo e validade', 'Download autorizado'],
    ['Consulta autorizada', 'Limite de volume', 'Proteção contra abuso'],
    ['Rotas da plataforma', 'Matriz de permissões', 'Verificação por operação'],
  ],
  configuracao: [
    ['Configuração publicada', 'Recursos necessários', 'Exposição mínima'],
    ['Navegador', 'Servidor responsável', 'Credencial do provedor'],
    ['Dependência proposta', 'Origem e manutenção', 'Decisão de adoção'],
    ['Ambiente de teste', 'Dados e credenciais', 'Separação de produção'],
    ['Credencial antiga', 'Substituição validada', 'Revogação efetiva'],
    ['Artefatos utilizados', 'Versões inventariadas', 'Composição do software'],
    ['Código revisado', 'Build verificado', 'Artefato publicado'],
    ['Configuração final', 'Verificações de entrega', 'Critérios de publicação'],
  ],
  desenvolvimento: [
    ['Entrada do usuário', 'Parâmetro separado', 'Estrutura do comando'],
    ['Dado não confiável', 'Contexto de saída', 'Exibição como texto'],
    ['Componente de origem', 'Fronteira de confiança', 'Validação no destino'],
    ['Consulta preparada', 'Valores vinculados', 'Resultado autorizado'],
    ['Conteúdo recebido', 'Renderização segura', 'Ausência de execução'],
    ['Requisição recebida', 'Formato e limites', 'Regra de negócio'],
    ['Pedido repetido', 'Transação e unicidade', 'Resultado consistente'],
    ['Fluxo de dados', 'Ameaça identificada', 'Requisito verificável'],
    ['API educativa', 'Controles por fronteira', 'Revisão dos casos'],
  ],
  deteccao: [
    ['Ação executada', 'Evento sem segredos', 'Registro investigável'],
    ['Recurso exposto', 'Impacto provável', 'Prioridade justificada'],
    ['Responsáveis definidos', 'Canais alternativos', 'Recuperação preparada'],
    ['Horários consistentes', 'Identificador comum', 'Correlação dos registros'],
    ['Regra de alerta', 'Contexto do evento', 'Triagem do analista'],
    ['Evidência preservada', 'Eventos ordenados', 'Linha do tempo'],
    ['Contenção aplicada', 'Causa tratada', 'Retorno validado'],
    ['Riscos do serviço', 'Controles e responsáveis', 'Plano integrado'],
  ],
};

export function specificDiagram(courseId: string, index: number, title: string) {
  const nodes = flows[courseId.replace('biblioteca-', '')]?.[index];
  if (!nodes) throw new Error(`Material específico ausente: ${courseId}/${index}`);
  return { title, nodes, notes: ['', '', ''], caption: `Relações principais da aula: ${title.toLowerCase()}.` };
}
