import { libraryCourses } from './course-library';
import { buildQuizReview } from './quiz-review';
import { contentId } from './catalog';
import { RETIRED_TRACK } from '../../src/certificacoes/certification-progress';

// Casos alternativos das mesmas aulas, não apenas reordenação de alternativas.
// Índice da aula (base zero), pergunta, resposta correta, resposta incorreta, explicação.
type Variant = [number, string, string, string, string];
const variants: Record<string, Variant[]> = {
 'biblioteca-contas': [
  [4, 'Um contato oferece ajuda para desbloquear sua conta, mas exige a senha. Como verificar a oferta com segurança?', 'Encerrar o contato e procurar o suporte pelo aplicativo ou endereço oficial.', 'Entregar a senha se a pessoa souber seu nome.', 'Conhecer seu nome não comprova identidade. A senha não deve ser entregue a quem solicita ajuda por contato inesperado.'],
  [5, 'Depois de proteger a senha, Ana recebe uma aprovação de entrada que não iniciou. A senha nova dispensa qualquer cuidado?', 'Não; ela deve recusar a entrada e conferir também sessões e recuperação.', 'Sim; pode aprovar porque a senha acabou de ser alterada.', 'Os cuidados se complementam: senha exclusiva, segunda etapa, sessões e recuperação fazem parte da proteção da conta.'],
 ],
 'biblioteca-dispositivos': [
  [3, 'Uma extensão de navegador promete descontos, mas pede acesso a todos os sites. O que deve pesar na decisão?', 'A necessidade real e o alcance das permissões, além da promessa de benefício.', 'Somente a quantidade de descontos anunciados.', 'Extensões podem acessar páginas e informações. O benefício anunciado não elimina a necessidade de avaliar origem e permissões.'],
  [4, 'O celular está com senha de bloqueio. Isso torna confiável um instalador enviado por desconhecidos?', 'Não; o bloqueio não verifica a origem nem a segurança de arquivos.', 'Sim; o bloqueio impede qualquer programa malicioso.', 'Bloqueio de tela protege o acesso físico, enquanto arquivos e aplicativos exigem cuidados próprios.'],
  [6, 'Um computador está atualizado, mas fica com a sessão aberta em local compartilhado. Qual cuidado falta?', 'Bloquear a tela ao se afastar e revisar os acessos necessários.', 'Desinstalar as atualizações para compensar a sessão aberta.', 'Atualização, bloqueio e permissões tratam riscos diferentes e devem ser usados em conjunto.'],
 ],
 'biblioteca-backup': [
  [4, 'Uma equipe aceita perder no máximo um dia de trabalho, mas faz cópias somente aos domingos. A rotina atende à necessidade?', 'Não; precisa considerar cópias mais frequentes para reduzir a perda possível.', 'Sim; toda cópia recupera automaticamente alterações posteriores.', 'A frequência determina quanto trabalho recente pode não estar protegido na cópia.'],
  [5, 'Uma cópia separada abriu corretamente no teste do mês passado. O que fazer agora?', 'Manter a rotina e repetir verificações de recuperação ao longo do tempo.', 'Parar de copiar, pois um teste bem-sucedido protege todos os arquivos futuros.', 'Uma rotina útil inclui atualização das cópias, separação e verificação contínua da possibilidade de recuperar.'],
 ],
 'biblioteca-redes': [
  [2, 'Na rede de um hotel, o navegador avisa que o certificado do portal de trabalho é inválido. Qual decisão é adequada?', 'Interromper o acesso e verificar a causa por um canal confiável.', 'Informar a senha mesmo assim porque o nome da rede parece conhecido.', 'Uma rede compartilhada não justifica ignorar um erro inesperado de certificado.'],
  [3, 'Um registro mostra tráfego para a porta 443. É possível concluir, só com isso, que a conexão é legítima?', 'Não; é necessário examinar protocolo, destino e contexto.', 'Sim; o número da porta comprova a legitimidade do serviço.', 'Portas ajudam a entender uma conexão, mas não comprovam segurança nem intenção.'],
  [4, 'Um nome não é resolvido, mas o equipamento mantém conexão com a rede. Qual hipótese merece investigação?', 'Uma falha de resolução DNS, separadamente da autenticação da aplicação.', 'Uma senha errada é a única explicação possível.', 'Resolver nomes e autenticar usuários são etapas distintas e devem ser diagnosticadas com evidências.'],
  [7, 'Um registro de rede tem muitos acessos durante uma atualização programada. Como avaliar a suspeita?', 'Comparar horários, destinos e a atividade prevista antes de concluir ataque.', 'Classificar como ataque apenas por haver um volume alto.', 'Uma análise guiada correlaciona registros com contexto e outras evidências.'],
 ],
 'biblioteca-privacidade': [
  [3, 'Uma planilha foi classificada como restrita, mas continua acessível por link público. O rótulo resolveu o risco?', 'Não; a classificação precisa orientar permissões e procedimentos concretos.', 'Sim; escrever restrito impede que terceiros abram o link.', 'A classificação só ajuda quando se traduz em controles durante o ciclo de vida dos dados.'],
  [4, 'Uma política exige descarte após certo prazo. Basta apagar o atalho que aparece na área de trabalho?', 'Não; é preciso verificar originais, versões e cópias conforme a política.', 'Sim; remover o atalho destrói todas as cópias existentes.', 'Descarte e retenção devem considerar onde os dados e suas cópias estão armazenados.'],
  [6, 'Uma equipe precisa compartilhar um relatório por uma semana. Qual configuração reduz exposição?', 'Acesso ao público necessário, com permissão adequada e prazo definido.', 'Link público permanente acompanhado de um pedido verbal de sigilo.', 'Público, permissão e duração devem acompanhar a finalidade do compartilhamento.'],
 ],
 'biblioteca-malware': [
  [3, 'Depois de um ransomware, uma cópia foi restaurada. O que verificar antes de reconectar a operação?', 'A causa do incidente, os acessos e as condições do ambiente recuperado.', 'Somente se os nomes dos arquivos voltaram a aparecer.', 'Restaurar arquivos não elimina automaticamente a origem do incidente nem dependências comprometidas.'],
  [4, 'A ferramenta de endpoint não mostrou alertas. Isso comprova que a estação não foi comprometida?', 'Não; a ausência de alertas deve ser avaliada junto de outras evidências.', 'Sim; uma ferramenta sem alertas elimina toda possibilidade de incidente.', 'Alertas têm limites de visibilidade e não substituem análise de execução e impacto.'],
  [6, 'O mesmo remetente desconhecido fornece um instalador e seu hash. A coincidência dos valores comprova procedência?', 'Não; a referência também deve vir de uma origem independente e confiável.', 'Sim; qualquer hash enviado junto comprova que o programa é legítimo.', 'Integridade comparada com uma referência controlada pelo mesmo remetente não comprova autenticidade.'],
  [7, 'Na análise de uma estação, faltam registros de um período. Como registrar a conclusão?', 'Distinguir fatos de hipóteses e indicar a lacuna de evidência.', 'Afirmar como fato a hipótese mais conveniente para encerrar o caso.', 'Uma investigação responsável registra incertezas e as evidências ainda necessárias.'],
 ],
 'biblioteca-remoto-ia': [
  [3, 'Uma pessoa entrou pela VPN, mas tenta abrir um arquivo de outra equipe. O túnel concede essa permissão?', 'Não; identidade e autorização continuam necessárias para o recurso.', 'Sim; a VPN concede acesso irrestrito a qualquer dado.', 'O túnel protege uma conexão, mas não substitui políticas de identidade e acesso.'],
  [5, 'Uma ferramenta corporativa limita o envio de documentos. É adequado usar a conta pessoal para contornar a regra?', 'Não; a rotina deve usar os canais aprovados e tratar a necessidade com a equipe responsável.', 'Sim; contas pessoais dispensam as políticas de proteção do trabalho.', 'Uma política de trabalho seguro considera ferramentas aprovadas, dados e responsabilidades.'],
 ],
 'biblioteca-acesso': [
  [2, 'Uma funcionalidade acaba de ser criada e ainda não tem política de acesso definida. Qual estado inicial é adequado?', 'Negar o acesso até existir uma permissão explícita válida.', 'Deixar aberta para todos e só restringir se houver reclamação.', 'Negar por padrão reduz exposições provocadas por permissões ainda não definidas.'],
  [3, 'Um atendente tem papel de suporte. Isso basta para abrir qualquer registro de qualquer cliente?', 'Não; devem ser verificadas também relações, atributos e o escopo do objeto.', 'Sim; o nome do papel elimina qualquer verificação sobre o objeto.', 'Um papel amplo não substitui a autorização contextual para o recurso solicitado.'],
  [5, 'Um token tem assinatura válida, mas a sessão foi revogada. A operação deve prosseguir?', 'Não; a validade atual da sessão e da autorização precisa ser verificada.', 'Sim; a assinatura torna qualquer token válido para sempre.', 'Integridade do token, expiração e revogação são condições diferentes de uma autorização.'],
  [7, 'Um relatório é gerado com autorização, mas seu endereço de download fica público indefinidamente. Qual etapa falhou?', 'A proteção do resultado e do acesso ao arquivo depois da geração.', 'Nenhuma; autorização na geração dispensa proteger o download.', 'A proteção deve acompanhar geração, entrega e acesso posterior ao arquivo.'],
  [8, 'Um usuário pode consultar um item. Isso significa que pode exportar todos os itens sem limite?', 'Não; permissão, escopo e volume precisam ser avaliados em conjunto.', 'Sim; permitir uma consulta equivale a permitir qualquer extração em massa.', 'Uma operação individual autorizada não torna legítimo qualquer padrão de uso.'],
  [9, 'Uma revisão encontrou acesso indevido entre contas. Como documentar um achado útil?', 'Indicar a regra violada, a evidência e um teste reproduzível.', 'Escrever apenas o nome de uma vulnerabilidade sem demonstrar o comportamento.', 'Uma revisão de autorização relaciona política, comportamento observado e verificação.'],
 ],
 'biblioteca-configuracao': [
  [0, 'Uma falha em produção mostra caminhos internos e detalhes de configuração a visitantes. Como reduzir essa exposição?', 'Restringir detalhes de depuração e apresentar uma mensagem apropriada ao usuário.', 'Manter todos os detalhes públicos para facilitar qualquer diagnóstico externo.', 'Configuração mínima deve evitar expor informações internas desnecessárias em produção.'],
  [3, 'Um teste usa credenciais e dados reais de produção por conveniência. Qual separação é necessária?', 'Usar credenciais e dados adequados ao ambiente, separados dos de produção.', 'Compartilhar a mesma credencial entre todos os ambientes para simplificar.', 'A separação limita o impacto de falhas em ambientes de teste e desenvolvimento.'],
  [5, 'O projeto declara três dependências diretas. O inventário pode ignorar os componentes trazidos por elas?', 'Não; versões distribuídas e dependências transitivas também integram o inventário.', 'Sim; apenas os nomes do primeiro arquivo fazem parte do software entregue.', 'Um SBOM deve refletir os componentes que efetivamente integram a entrega.'],
  [7, 'Um checklist de publicação foi marcado como completo sem evidências. O que torna a verificação útil?', 'Exigir evidências por controle e registrar as exceções encontradas.', 'Aprovar todos os itens para cumprir a data de publicação.', 'Um checklist verificável precisa demonstrar a condição dos controles e tratar exceções.'],
 ],
 'biblioteca-desenvolvimento': [
  [1, 'Uma plataforma educativa recebe uma mensagem contendo HTML de um cenário. Como apresentá-la com segurança?', 'Exibir o conteúdo sem executar scripts ou HTML fornecidos como dados.', 'Executar o conteúdo para tornar a simulação mais convincente.', 'Saída adequada ao contexto impede que um dado recebido ganhe capacidade de execução.'],
  [2, 'Um sistema recebe dados do navegador e depois chama outro serviço. O que o desenho de fronteiras ajuda a localizar?', 'Os pontos em que confiança muda e controles precisam ser aplicados.', 'As partes do código que não precisam mais ser revisadas.', 'Fronteiras de confiança orientam onde validar dados e aplicar políticas.'],
  [3, 'O usuário escolhe a coluna de ordenação de uma consulta. Como tratar esse identificador dinâmico?', 'Restringir a escolha a uma lista permitida e parametrizar os valores.', 'Concatenar qualquer texto depois de remover apenas aspas.', 'Parâmetros protegem valores; identificadores dinâmicos exigem controle próprio.'],
  [5, 'A interface limita uma quantidade a 10, mas a requisição enviada diretamente informa 1000. Onde aplicar a regra?', 'Também no servidor ou ponto de processamento confiável.', 'Somente no atributo do campo exibido no navegador.', 'A validação no cliente não controla requisições produzidas fora da interface.'],
  [7, 'Um requisito diz apenas que a API deve ser segura. Como torná-lo verificável?', 'Definir o comportamento esperado e um teste com resultado observável.', 'Acrescentar a palavra totalmente sem estabelecer um teste.', 'Requisitos verificáveis permitem demonstrar se uma proteção atende ao risco considerado.'],
 ],
 'biblioteca-deteccao': [
  [2, 'Uma equipe terminou um exercício de resposta a incidente. Qual é o próximo passo de preparação?', 'Registrar lições e ajustar os procedimentos com base no que foi observado.', 'Guardar o roteiro sem discutir as dificuldades.', 'Exercícios ajudam a melhorar a resposta quando os aprendizados geram ajustes.'],
  [3, 'Registros de dois serviços usam horários sem informar o fuso. O que é necessário para correlacioná-los?', 'Padronizar ou explicitar o contexto temporal e campos de correlação.', 'Ordenar os textos como aparecem e presumir que representam o mesmo horário.', 'Qualidade de registros inclui contexto temporal consistente e identificadores de correlação.'],
  [4, 'Um alerta de autenticação dispara durante uma manutenção. Como iniciar a triagem?', 'Investigar o contexto e buscar evidências antes de declarar invasão.', 'Confirmar invasão somente porque o alerta foi disparado.', 'Um alerta inicia a análise; falsos positivos e contexto precisam ser considerados.'],
  [7, 'O plano final apresenta muitas ferramentas, mas não explica os riscos atendidos. O que falta?', 'Relacionar cada risco aos controles, evidências e procedimentos de resposta.', 'Adicionar mais nomes de ferramentas sem justificar a escolha.', 'Um plano de defesa precisa demonstrar a ligação entre risco, controles e verificação.'],
 ],
};

export function certificationLessons() {
 return libraryCourses.filter(course => contentId(course.id) !== RETIRED_TRACK).flatMap(course => {
  const extras = new Map(course.lessons.flatMap((_, index) => buildQuizReview(course, index)).filter(question => question.key.startsWith('review/')).map(question => [question.sourceLessonId, question]));
  return course.lessons.map((lesson, index) => {
   const extra = extras.get(lesson.id);
   const authored = variants[course.id]?.find(item => item[0] === index);
   if (!extra && !authored) throw new Error(`Falta variante de prova: ${course.id}/${lesson.id}`);
   return { aulaId: contentId(`${course.id}/${lesson.id}`), nivel: course.level, titulo: lesson.title, questoes: [
    { enunciado: lesson.question, explicacao: lesson.explanation, alternativas: lesson.options.map((texto, i) => ({ texto, isCorreta: i === lesson.correct })) },
    extra ? { enunciado: extra.enunciado, explicacao: extra.explicacao, alternativas: extra.alternativas.map(answer => ({ texto: answer.texto, isCorreta: answer.correta })) } : { enunciado: authored![1], explicacao: authored![4], alternativas: [{ texto: authored![2], isCorreta: true }, { texto: authored![3], isCorreta: false }] },
   ] };
  });
 });
}
