CREATE TABLE "TermosUso" (
  "id" SERIAL NOT NULL,
  "versao" TEXT NOT NULL,
  "conteudo" TEXT NOT NULL,
  "publicadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TermosUso_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TermosUso_versao_key" ON "TermosUso"("versao");

INSERT INTO "TermosUso" ("versao", "conteudo") VALUES ('2026-11-21', '## Aceitação dos Termos

Ao criar uma conta, você aceita estes Termos de Uso. A Política de Privacidade explica como seus dados são utilizados; conhecer essa política não representa um consentimento genérico para qualquer uso dos dados.

## Finalidade da plataforma

O CyberEduca+ oferece aulas, trilhas, quizzes, simulações fictícias de phishing, avaliações e um laboratório de consulta de domínios. As atividades de aprendizagem acontecem dentro da plataforma. O conteúdo é educacional e não autoriza ataques ou testes contra sistemas e pessoas de terceiros.

## Cadastro e conta

O usuário deve fornecer informações verdadeiras, completas e atualizadas, manter suas credenciais em sigilo e comunicar qualquer uso não autorizado. Cada conta é pessoal e não pode ser cedida.

A plataforma poderá solicitar confirmação de identidade para proteger a conta, atender direitos ou investigar atividades suspeitas.

## Uso aceitável

É proibido usar o CyberEduca+ para:


- praticar fraude, phishing real, invasão, assédio ou qualquer atividade ilícita;
- tentar acessar contas, áreas administrativas, sistemas ou dados sem autorização;
- copiar, automatizar, explorar vulnerabilidades ou sobrecarregar o serviço;
- inserir código malicioso ou utilizar o conteúdo para prejudicar terceiros;
- violar direitos autorais, privacidade ou outros direitos de terceiros.

## Simulações de phishing

Os cenários de phishing são fictícios e destinados exclusivamente ao aprendizado. O usuário não deve reproduzi-los contra pessoas ou organizações. Resultados, classificações e explicações são educacionais e podem não representar todas as técnicas existentes.

## Conteúdo e propriedade intelectual

Textos, interfaces, ilustrações, marcas, aulas, quizzes, cenários e demais materiais pertencem ao CyberEduca+ ou a seus respectivos licenciantes. É permitido o uso pessoal e educacional dentro da plataforma. Reprodução, distribuição, adaptação ou exploração comercial dependem de autorização prévia, salvo permissões legais ou licenças expressamente indicadas.

## Disponibilidade e alterações

A plataforma poderá receber manutenção, correções e atualizações. Funcionalidades podem ser modificadas, suspensas ou descontinuadas mediante comunicação razoável quando isso afetar significativamente o usuário. Não é garantida disponibilidade ininterrupta, especialmente em casos de falha técnica, manutenção ou evento fora de controle razoável.

## Encerramento da conta

Você pode excluir sua conta em [Configurações](/configuracoes). Após clicar em Excluir minha conta, é necessário digitar **excluir** e confirmar. A operação remove o cadastro e o histórico vinculado no banco ativo da plataforma, encerra o acesso e não pode ser desfeita. Progresso, respostas, resultados e conquistas deixam de estar disponíveis. Excluir a conta no CyberEduca+ não exclui sua conta Google nem dados mantidos por outros serviços.

## Responsabilidades

O CyberEduca+ adota medidas razoáveis para manter conteúdos corretos e o serviço seguro, mas não responde por decisões tomadas exclusivamente com base no material educacional, por uso indevido da plataforma, por serviços de terceiros ou por danos decorrentes de fato inevitável, respeitados os direitos que não possam ser excluídos pela legislação brasileira.

## Lei aplicável e solução de conflitos

Estes Termos são regidos pelas leis brasileiras, incluindo o Marco Civil da Internet, a LGPD e, quando aplicável, o Código de Defesa do Consumidor. Fica assegurado ao usuário o acesso aos órgãos de defesa do consumidor e ao foro legalmente competente, sem imposição de foro que restrinja direitos obrigatórios.

## Alterações destes Termos

Mudanças relevantes serão informadas de forma destacada na plataforma. A versão vigente indicará a data de atualização. Quando uma alteração exigir novo consentimento, ele será solicitado antes da continuidade do tratamento ou uso correspondente.');
