import type { LibraryCourse } from './course-library';

// Cada linha é uma aula: título, explicação, caso, decisão adequada, equívoco.
type BasicUnit = [string, string, string, string, string];
const basic: Record<string, BasicUnit[]> = {
  contas: [
    ['Uma senha diferente para cada conta', 'Sua senha protege suas mensagens e contas. Use uma senha longa e diferente em cada serviço. Um aplicativo de confiança que guarda senhas pode ajudar; você não precisa instalar nenhum para esta aula.', 'Uma loja perdeu a senha que Ana também usa no e-mail. Agora alguém pode tentar a mesma senha nas duas contas.', 'Trocar as senhas repetidas por senhas diferentes.', 'Trocar só a senha da loja e repetir a mesma no e-mail.'],
    ['Uma confirmação além da senha', 'Algumas contas pedem outra confirmação depois da senha. Essa etapa extra dificulta a entrada de outra pessoa. Não compartilhe códigos e não aprove uma entrada que você não começou.', 'Bruno recebe um pedido para confirmar uma entrada enquanto não está usando a conta.', 'Recusar o pedido e conferir a conta pelo aplicativo oficial.', 'Aprovar o pedido só para a mensagem desaparecer.'],
    ['Como voltar à sua conta', 'Perder o celular não deveria significar perder todas as contas. Os serviços têm caminhos oficiais de recuperação. Contatos de recuperação atualizados e códigos de reserva guardados com cuidado podem ajudar.', 'Carla perdeu o celular e precisa voltar à conta. Uma pessoa oferece recuperar tudo se ela enviar a senha.', 'Usar o caminho oficial de recuperação do serviço.', 'Enviar a senha para a pessoa que prometeu resolver.'],
    ['Sair da conta em um aparelho compartilhado', 'Fechar uma aba nem sempre faz você sair da conta. Em um aparelho compartilhado, use a opção de sair e não deixe sua senha salva.', 'Ana fecha a aba da loja no computador da biblioteca, mas outra pessoa abre a página e ainda encontra sua conta.', 'Usar a opção de sair da conta ao terminar.', 'Acreditar que fechar a aba sempre encerra o acesso.'],
    ['Cuidado com quem pede sua senha', 'Uma pessoa pode imitar o suporte de uma empresa para pedir sua senha. Não envie senhas ou códigos. Entre no aplicativo oficial para conferir avisos.', 'Uma mensagem diz ser do suporte e pede que Ana envie sua senha para manter a conta funcionando.', 'Não enviar e conferir o aviso pelo canal oficial.', 'Enviar porque a mensagem tem o logotipo da empresa.'],
    ['Revisão: protegendo as contas da Ana', 'Três cuidados se completam: uma senha diferente em cada conta, uma confirmação extra quando disponível e um caminho conhecido para recuperar o acesso. Comece pelos serviços mais importantes, como o e-mail.', 'Ana repete a senha da loja no e-mail, recebe um pedido inesperado de entrada e não sabe como recuperar a conta.', 'Trocar a senha repetida, recusar a entrada desconhecida e conhecer a recuperação oficial.', 'Manter a senha repetida e aprovar qualquer pedido de entrada.'],
  ],
  golpes: [
    ['Quando a mensagem tenta te apressar', 'Pedidos muito urgentes podem tentar impedir que você pense. Pare antes de pagar ou entregar informações. Confirme o pedido com a pessoa por um contato que você já conhece.', 'Uma mensagem em nome do chefe exige uma transferência em cinco minutos e pede segredo.', 'Confirmar o pedido por outro contato conhecido.', 'Pagar imediatamente para não contrariar o chefe.'],
    ['Nome e foto não provam quem enviou', 'Uma mensagem pode usar a foto e o nome de alguém conhecido. Isso não garante que foi essa pessoa quem escreveu. Confira pedidos inesperados por outro caminho.', 'O perfil de um amigo pede dinheiro, mas o jeito de escrever parece diferente.', 'Ligar para o contato do amigo que já estava salvo.', 'Confiar apenas na foto do perfil.'],
    ['E se eu já tiver clicado?', 'Clicar em algo suspeito não significa que você perdeu tudo. Pense no que aconteceu: só abriu a página ou também informou uma senha? Procure o serviço oficial para proteger a conta se entregou dados. No trabalho, avise o suporte.', 'Ana abriu uma página e percebeu que tinha acabado de informar a senha em uma imitação da loja.', 'Trocar a senha pelo serviço oficial e procurar ajuda.', 'Esconder o ocorrido e continuar usando a mesma senha.'],
    ['Abra o serviço pelo caminho conhecido', 'Uma mensagem pode mostrar o nome de uma loja e levar a outro lugar. Em vez de tentar adivinhar pelo desenho da página, abra o aplicativo ou endereço oficial que você já conhece.', 'Uma cobrança chega por mensagem com um botão para pagar. Ana não esperava nenhuma cobrança.', 'Abrir o aplicativo oficial e verificar se a cobrança existe.', 'Pagar pelo botão porque a página tem o logotipo correto.'],
    ['Cuidados com arquivos e quadradinhos de acesso', 'Um arquivo inesperado ou um quadradinho para abrir uma página pode levar a conteúdo enganoso. A aparência não garante a origem. Confirme antes de abrir ou continuar.', 'Um cartaz de pagamento tem um adesivo novo por cima do quadradinho original.', 'Conferir com o estabelecimento antes de usar.', 'Continuar porque todo quadradinho de acesso é seguro.'],
    ['Confira quem vai receber o pagamento', 'Antes de confirmar um pagamento, confira o nome de quem recebe e o valor. Desconfie de mudanças inesperadas de conta ou pedidos feitos com pressa.', 'Uma loja pede para pagar em uma conta de uma pessoa desconhecida, diferente da compra anterior.', 'Confirmar a mudança com a loja pelo contato oficial.', 'Pagar porque o valor está correto.'],
    ['Nem toda voz ou imagem é verdadeira', 'Vozes e vídeos podem ser imitados ou alterados. Um pedido de dinheiro continua precisando de confirmação, mesmo quando parece ter a voz de alguém conhecido.', 'Ana recebe um áudio parecido com a voz do irmão pedindo dinheiro com urgência.', 'Falar com o irmão pelo contato que ela já conhece.', 'Transferir só porque reconheceu a voz.'],
    ['Revisão: reconheça os sinais de um golpe', 'Pressa, pedidos de segredo e solicitações inesperadas merecem atenção. Você não precisa descobrir como o golpe funciona para parar e confirmar.', 'Uma mensagem promete um prêmio, pede pagamento imediato e diz para Ana não contar a ninguém.', 'Parar e verificar a informação por um canal oficial.', 'Pagar rapidamente para não perder o prêmio.'],
  ],
  dispositivos: [
    ['Por que atualizar o celular e o computador?', 'Atualizações podem corrigir problemas e melhorar a proteção. Confira avisos pelas configurações do próprio aparelho ou pela loja oficial de aplicativos, em vez de confiar em anúncios.', 'Uma propaganda afirma que o celular está em perigo e pede para baixar uma atualização desconhecida.', 'Conferir atualizações nas configurações oficiais.', 'Baixar pelo anúncio sem conferir a origem.'],
    ['O que um aplicativo precisa acessar?', 'Um aplicativo pode pedir acesso à câmera, aos contatos ou à localização. O pedido deve combinar com o que ele faz. Você pode negar um acesso que não faz sentido.', 'Uma calculadora pede a lista de contatos para resolver uma soma.', 'Questionar o pedido e não liberar sem necessidade.', 'Liberar tudo porque o aplicativo pediu.'],
    ['Proteja a tela quando se afastar', 'O bloqueio de tela ajuda a impedir que outra pessoa use seu aparelho sem você. Se perder o aparelho, procure os canais oficiais para proteger as contas e pedir ajuda.', 'Ana deixa o celular desbloqueado na mesa e sai por alguns minutos.', 'Bloquear a tela antes de se afastar.', 'Só diminuir o brilho da tela.'],
    ['Cuidado com os extras do navegador', 'O navegador é o aplicativo que abre os sites. Alguns extras prometem descontos ou facilidades, mas também podem acessar informações. Instale apenas o que entende e realmente precisa.', 'Uma janela oferece um extra desconhecido que promete descontos e quer ler todas as páginas abertas.', 'Não instalar só pela promessa de desconto.', 'Instalar tudo que aparecer para melhorar a navegação.'],
    ['Um aparelho bloqueado merece outros cuidados', 'Bloquear a tela é importante, mas não resolve tudo. Continue cuidando dos aplicativos, das mensagens e de quem usa seu aparelho. Uma proteção não substitui as demais.', 'Ana acha que pode abrir qualquer arquivo porque o celular tem bloqueio de tela.', 'Manter o bloqueio e também conferir arquivos e aplicativos.', 'Confiar que o bloqueio torna qualquer arquivo seguro.'],
    ['Quando o aparelho deixa de receber melhorias', 'Alguns aparelhos e programas deixam de receber atualizações de proteção. Isso aumenta os cuidados necessários. Procure orientação do fabricante ou suporte para planejar uma alternativa.', 'Um computador continua ligando, mas há muito tempo não recebe correções do fabricante.', 'Verificar o suporte e planejar uma alternativa adequada.', 'Presumir que está protegido só porque ainda liga.'],
    ['Revisão: os cuidados se completam', 'Atualizações, bloqueio de tela e atenção aos acessos dos aplicativos ajudam juntos. Não existe um único botão que resolva todos os riscos.', 'Ana atualiza o celular, mas deixa a tela aberta e autoriza todos os pedidos dos aplicativos.', 'Manter as atualizações e revisar também o bloqueio e os acessos.', 'Parar de atualizar porque os outros cuidados são suficientes.'],
  ],
  backup: [
    ['Uma cópia para não perder seus arquivos', 'Uma cópia de segurança permite recuperar fotos ou trabalhos se algo acontecer com o original. Uma pasta que repete automaticamente as mudanças pode repetir também uma exclusão.', 'Ana apaga um trabalho e percebe que ele sumiu também da pasta que acompanhava as mudanças.', 'Ter uma cópia que permita recuperar o arquivo apagado.', 'Achar que toda pasta que acompanha mudanças garante recuperação.'],
    ['O que vale a pena guardar?', 'Pense nos arquivos que fariam falta e em quanto eles mudam. Um trabalho alterado todos os dias precisa de atenção mais frequente que uma foto antiga. Proteja também quem pode ver as cópias.', 'Bruno muda um trabalho todos os dias, mas só guarda uma cópia no fim do mês.', 'Guardar cópias com uma frequência que acompanhe as mudanças.', 'Esperar o trabalho desaparecer para pensar na cópia.'],
    ['Uma cópia precisa poder ser aberta', 'Ver o nome de uma cópia não garante que ela funciona. É importante saber se o arquivo pode ser recuperado e aberto. Nesta aula, você decide a partir do exemplo, sem mexer em arquivos reais.', 'Ana tem uma cópia do trabalho, mas ela nunca foi aberta para conferir se está completa.', 'Conferir uma recuperação sem apagar o original.', 'Apagar o original antes de saber se a cópia funciona.'],
    ['Guarde mais de uma versão', 'Se uma alteração errada chegar a todas as cópias, você pode precisar de uma versão anterior. Guardar tudo no mesmo aparelho também deixa as cópias expostas à perda desse aparelho.', 'O notebook de Carla foi perdido. A única cópia do trabalho estava em outra pasta no mesmo notebook.', 'Manter uma cópia separada do aparelho principal.', 'Criar mais pastas apenas no mesmo notebook.'],
    ['Quanto do trabalho você conseguiria recuperar?', 'Uma cópia antiga não contém as mudanças mais recentes. Além de saber onde está a cópia, pense no que ela contém e no tempo que levaria para voltar a usar o arquivo.', 'A última cópia de Ana é de segunda-feira. Na sexta, ela perde o arquivo que vinha mudando todos os dias.', 'Reconhecer que as mudanças depois de segunda podem não estar na cópia.', 'Achar que uma cópia antiga contém automaticamente as mudanças novas.'],
    ['Revisão: escolha a cópia que ajuda', 'Uma boa rotina considera quais arquivos importam, onde a cópia fica e se ela pode ser recuperada. Você não precisa usar programas especiais para entender essas escolhas.', 'Bruno guarda uma cópia separada, mantém uma versão anterior e sabe que o arquivo pode ser aberto.', 'Manter e revisar essa rotina ao longo do tempo.', 'Abandonar as cópias porque o computador ainda funciona.'],
  ],
};

export const glossary: Record<string, string> = {
  TCP: 'forma de comunicação que organiza a entrega de dados entre dois pontos',
  HTTPS: 'acesso a um site com comunicação protegida; não garante que o conteúdo seja honesto',
  porta: 'número que ajuda a indicar qual serviço está sendo acessado em uma conexão',
  certificado: 'informação usada para verificar a identidade de um serviço na conexão',
  hash: 'resultado de um cálculo sobre um arquivo, usado para comparar sua integridade',
  criptografia: 'transformação de dados para protegê-los de quem não possui a chave adequada',
  autenticação: 'verificação da identidade de quem tenta acessar',
  integridade: 'propriedade de um dado que não foi alterado indevidamente',
  'prompt injection': 'instrução indevida inserida em conteúdo que um assistente deveria apenas analisar',
  contenção: 'medida para limitar a propagação e o impacto de um problema',
  evidências: 'registros e observações usados para apoiar uma conclusão',
  firmware: 'programa interno que controla o funcionamento de um equipamento',
  IP: 'endereço usado para identificar uma conexão em uma rede',
  DNS: 'serviço que relaciona nomes de sites a endereços de rede',
  TLS: 'proteção da comunicação entre um aplicativo e um serviço',
  firewall: 'controle que permite ou bloqueia comunicações conforme regras',
  segmentação: 'separação de uma rede em grupos com acessos definidos',
  metadados: 'informações sobre um arquivo, como data, autor ou localização',
  retenção: 'prazo e condições para manter dados armazenados',
  malware: 'programa criado para causar danos ou realizar ações indesejadas',
  ransomware: 'programa malicioso que bloqueia dados e pode exigir pagamento',
  endpoint: 'dispositivo usado para acessar os serviços, como um computador',
  privilégios: 'permissões que uma conta ou programa possui',
  VPN: 'conexão protegida até um serviço de rede; não garante que todo destino seja confiável',
  IA: 'sistema que produz respostas ou realiza tarefas a partir de dados e instruções',
};

export function applyLearningLevels(courses: LibraryCourse[]) {
  for (const course of courses) {
    const units = basic[course.id.replace('biblioteca-', '')];
    if (course.level === 'BASICO') {
      const titles: Record<string, string> = {
        'biblioteca-contas': 'Cuidados com suas contas',
        'biblioteca-golpes': 'Como reconhecer mensagens e pedidos suspeitos',
        'biblioteca-dispositivos': 'Cuidados com o celular e o computador',
        'biblioteca-backup': 'Cópias de segurança dos seus arquivos',
      };
      course.title = titles[course.id];
      const descriptions: Record<string, string> = {
        'biblioteca-contas': 'Proteja suas senhas, reconheça pedidos de acesso e saiba como recuperar uma conta.',
        'biblioteca-golpes': 'Reconheça mensagens que tentam apressar você e confira pedidos antes de clicar ou pagar.',
        'biblioteca-dispositivos': 'Entenda atualizações, bloqueio de tela e os acessos que seus aplicativos pedem.',
        'biblioteca-backup': 'Descubra como cópias e versões anteriores ajudam a recuperar fotos e trabalhos perdidos.',
      };
      course.description = descriptions[course.id];
      if (!units || units.length !== course.lessons.length) throw new Error(`Revisão básica incompleta: ${course.id}`);
      course.lessons.forEach((lesson, i) => {
        const [title, concept, story, good, bad] = units[i];
        lesson.title = title; lesson.concept = concept; lesson.caseStudy = story;
        lesson.question = `${story} Qual é a melhor escolha?`;
        lesson.options = i % 2 ? [bad, good] : [good, bad]; lesson.correct = i % 2 ? 1 : 0;
        lesson.explanation = `${good} ${concept}`;
        lesson.objectives = ['Reconhecer a situação e escolher um cuidado simples.'];
        lesson.expected = good;
      });
    }
    for (const lesson of course.lessons) {
      if (course.level !== 'BASICO') lesson.title = lesson.title.replace(/^(Laboratório|Projeto|Oficina|Exercício de mesa): /, 'Análise guiada: ');
      lesson.practice = course.level === 'BASICO'
        ? 'Leia a situação e escolha uma resposta na atividade abaixo. A explicação aparece aqui no site depois de responder.'
        : 'Analise o exemplo desta página e responda à atividade abaixo. A correção é feita aqui no site; não é necessário produzir arquivos, instalar programas ou acessar outros serviços.';
      lesson.objectives = course.level === 'BASICO' ? lesson.objectives : [
        `Entender ${lesson.title.toLowerCase()}.`,
        'Analisar o exemplo e responder à atividade dentro desta página.',
      ];
      // Retira instruções antigas de entrega dos casos, mantendo a situação explicada.
      lesson.caseStudy = lesson.caseStudy?.split(/(?<=[.!?])\s+/).filter(sentence =>
        !/exercício|atividade|entregue|produza|na sua entrega|desenhe|registre|escreva/i.test(sentence),
      ).join(' ');
    }
  }
}

const basicFlows: Record<string, [string, string, string][]> = {
  'biblioteca-contas': [
    ['Senha repetida', 'Uma loja sofre vazamento', 'Outras contas ficam expostas'],
    ['Senha informada', 'Outra confirmação', 'Entrada na conta'],
    ['Celular perdido', 'Recuperação oficial', 'Acesso recuperado'],
    ['Conta aberta', 'Fechar apenas a aba', 'Acesso pode continuar'],
    ['Suposto suporte', 'Pedido de senha', 'Confira no canal oficial'],
    ['Senhas diferentes', 'Confirmação extra', 'Recuperação preparada'],
  ],
  'biblioteca-golpes': [
    ['Pedido urgente', 'Pausa para pensar', 'Confirmação independente'],
    ['Nome conhecido', 'Pedido inesperado', 'Contato já salvo'],
    ['Página suspeita', 'O que foi informado?', 'Proteção pelo canal oficial'],
    ['Cobrança por mensagem', 'Aplicativo oficial', 'Verificar a pendência'],
    ['Arquivo inesperado', 'Conferir a origem', 'Decidir antes de abrir'],
    ['Pagamento solicitado', 'Nome e valor', 'Conferência antes de pagar'],
    ['Voz familiar', 'Pedido de dinheiro', 'Confirmação por outro canal'],
    ['Promessa de prêmio', 'Pressa e segredo', 'Parar para conferir'],
  ],
  'biblioteca-dispositivos': [
    ['Aviso de atualização', 'Configurações oficiais', 'Melhorias de proteção'],
    ['Aplicativo pede acesso', 'Isso faz sentido?', 'Somente o necessário'],
    ['Afastar-se do aparelho', 'Bloquear a tela', 'Evitar o uso por terceiros'],
    ['Extra do navegador', 'Acesso às páginas', 'Avaliar antes de instalar'],
    ['Tela protegida', 'Arquivos e aplicativos', 'Cuidados se completam'],
    ['Aparelho antigo', 'Fim das atualizações', 'Planejar uma alternativa'],
    ['Atualizar', 'Bloquear a tela', 'Revisar acessos'],
  ],
  'biblioteca-backup': [
    ['Arquivo original', 'Cópia separada', 'Possibilidade de recuperar'],
    ['Trabalho muda todo dia', 'Cópias frequentes', 'Menos trabalho perdido'],
    ['Cópia disponível', 'Conferir a recuperação', 'Arquivo pode ser aberto'],
    ['Aparelho perdido', 'Cópia em outro local', 'Trabalho preservado'],
    ['Cópia de segunda-feira', 'Mudanças até sexta', 'O que ficou de fora?'],
    ['Arquivos importantes', 'Cópias e versões', 'Recuperação conferida'],
  ],
};

export function basicLessonDiagram(courseId: string, index: number, title: string) {
  const nodes = basicFlows[courseId]?.[index];
  if (!nodes) throw new Error(`Diagrama básico ausente: ${courseId}/${index}`);
  return { title: title.replace(/^\d+\.\s*/, ''), nodes, notes: ['', '', ''], caption: 'Acompanhe a relação entre as etapas do exemplo.' };
}
