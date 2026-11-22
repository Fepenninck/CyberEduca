CREATE TABLE "PoliticaPrivacidade" (
  "id" SERIAL NOT NULL,
  "versao" TEXT NOT NULL,
  "conteudo" TEXT NOT NULL,
  "publicadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PoliticaPrivacidade_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PoliticaPrivacidade_versao_key" ON "PoliticaPrivacidade"("versao");
INSERT INTO "PoliticaPrivacidade" ("versao", "conteudo", "publicadoEm") VALUES ('2026-11-21', '## Responsável e contato

O CyberEduca+ é um projeto acadêmico de educação em cibersegurança. Para dúvidas sobre seus dados ou para exercer seus direitos, entre em contato com a equipe responsável pelo e-mail [cybereduca.oficial@gmail.com](mailto:cybereduca.oficial@gmail.com). O atendimento de pedidos de privacidade é gratuito.

## Dados utilizados pelo site

O cadastro solicita nome, e-mail e senha, quando o acesso é feito por senha. Conforme as funções utilizadas, também são armazenados:


- senha protegida por hash, nunca em texto aberto;
- identificador do Google, se você escolher entrar com Google;
- foto e avatar, se você optar por adicioná-los;
- aulas concluídas, progresso e informações usadas para apresentar conquistas;
- respostas, tentativas, notas e resultados de quizzes, simulações e avaliações;
- domínios consultados no laboratório e seus resultados;
- datas de cadastro e de atividades, eventos de segurança, endereço IP e informações do navegador nos registros de autenticação e auditoria;
- token temporário de recuperação de senha protegido por hash, quando solicitado.

Não solicitamos CPF, endereço, telefone, dados bancários ou dados pessoais sensíveis para utilizar as atividades. Não envie dados reais de terceiros nos exercícios.

## Por que esses dados são necessários

Nome e e-mail identificam sua conta. Os dados de autenticação protegem o acesso e permitem recuperar a senha. O histórico de atividades permite continuar as aulas, calcular progresso, exibir notas e reconhecer conquistas. Os registros técnicos ajudam a identificar falhas e tentativas de acesso indevido. Foto e avatar servem para personalizar o perfil. A equipe administrativa acessa informações de aprendizagem e gestão conforme suas permissões.

## Uso necessário e escolhas opcionais

Os dados necessários à conta e às atividades são tratados para prestar o serviço educacional solicitado por você. Registros de segurança são utilizados para proteger o acesso e prevenir abuso, observados necessidade e proporcionalidade. Foto, avatar, entrada com Google e consulta de domínios dependem da sua escolha de usar essas funções. Uma finalidade nova que dependa de consentimento deverá ser informada e autorizada separadamente; aceitar os Termos não autoriza qualquer finalidade adicional.

## Cookies e armazenamento no navegador

O cookie de sessão mantém seu acesso autenticado. Outro cookie registra por um ano que o aviso de boas-vindas já foi fechado neste navegador. Um cookie necessário guarda sua escolha de privacidade por 180 dias neste navegador, sem sincronizá-la com sua conta ou outros dispositivos. No primeiro acesso de outro navegador ou dispositivo, após a expiração ou ao apagar os cookies, o aviso aparece novamente. Somente se você permitir a personalização, o armazenamento local guarda identificadores das celebrações de conquistas já exibidas. Rejeitar ou revogar essa permissão remove esses identificadores, sem apagar conquistas ou progresso da conta. Você pode alterar sua escolha pelo botão “Preferências de cookies”, disponível nas páginas do site. A implementação atual não ativa ferramentas de publicidade ou métricas de navegação de terceiros. Bloquear o cookie de sessão impede manter o acesso à conta.

## Serviços utilizados e conteúdo externo

Hospedagem, banco de dados e envio de e-mails são necessários para operar o serviço. Na entrada com Google, a plataforma recebe nome, e-mail e identificador da conta Google. Ao consultar um domínio no laboratório, o domínio é enviado ao VirusTotal para obter informações de segurança; essa consulta não envia seu nome ou e-mail ao provedor.

Ao abrir links ou reproduzir conteúdo externo, o serviço responsável pelo conteúdo recebe as informações técnicas necessárias à conexão e aplica sua própria política. Os fornecedores de infraestrutura e seus locais de processamento dependem do ambiente de hospedagem; informações sobre esses operadores e eventual transferência internacional podem ser solicitadas pelo canal de contato. Não comercializamos seus dados pessoais.

## Exclusão e conservação

O cadastro e o histórico são mantidos enquanto sua conta estiver ativa para fornecer as funcionalidades de aprendizagem. Em [Configurações](/configuracoes), você pode excluir a conta digitando **excluir** na confirmação. O sistema remove o cadastro, foto, credenciais, progresso, tentativas, respostas, resultados, consultas e registros de auditoria vinculados no banco ativo, e encerra a sessão.

Arquivos que você tenha baixado e dados mantidos por serviços externos não são apagados por esse botão. A eliminação de eventuais cópias de segurança depende dos procedimentos do ambiente de hospedagem. Para informações sobre cópias, prazos ou uma conservação exigida por lei, utilize o canal de contato.

## Proteção da conta

A aplicação utiliza hash de senhas, autenticação por sessão, controle de acesso, validação de entradas e registros de segurança. Proteja sua senha e não compartilhe o acesso. Se suspeitar de uso indevido, altere a senha e comunique a equipe. Nenhum sistema elimina todos os riscos de segurança.

## Seus direitos e como exercê-los

Você pode corrigir nome, e-mail e imagem em [Configurações](/configuracoes) e excluir sua conta no mesmo local. Outros pedidos podem ser feitos gratuitamente pelo e-mail [cybereduca.oficial@gmail.com](mailto:cybereduca.oficial@gmail.com), incluindo confirmação e acesso aos dados, informações sobre uso e compartilhamento, correção, portabilidade quando aplicável, análise de bloqueio, anonimização ou eliminação de dados desnecessários ou tratados de forma irregular, e revisão de decisões automatizadas que afetem seus interesses.

Se um tratamento depender de consentimento, você pode solicitar sua revogação. A equipe poderá confirmar sua identidade por um meio proporcional e informará o atendimento ou a justificativa de eventual impossibilidade, observados os prazos legais. Você também pode procurar a ANPD e os demais órgãos competentes.

## Crianças e adolescentes

O uso por crianças e adolescentes deve observar seu melhor interesse e as exigências legais aplicáveis, inclusive a participação do responsável quando necessária. Não devem ser enviados documentos, dados sensíveis ou informações excessivas nos exercícios ou pelo canal de suporte.

## Notas e progresso

Notas, percentuais e conquistas são calculados a partir das atividades realizadas. São resultados educacionais da plataforma. Para pedir esclarecimentos sobre os critérios ou revisão de um resultado, entre em contato com a equipe responsável.

## Comunicação de incidentes

Se identificar suspeita de exposição de dados ou acesso indevido, comunique o fato pelo canal de contato, sem enviar senhas. A equipe deverá investigar o ocorrido e cumprir as obrigações de comunicação aplicáveis ao caso.

## Atualizações desta política

Esta política deve acompanhar as funcionalidades e os serviços efetivamente utilizados. Mudanças relevantes serão informadas aos usuários. A data da última atualização desta página está indicada no rodapé.', CURRENT_TIMESTAMP AT TIME ZONE 'UTC');
