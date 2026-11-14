import type { LessonMaterial } from './lesson-material'

const topics: [RegExp, string, string][] = [
  [/senha diferente|senhas únicas/i, 'Por que uma senha não deve abrir todas as portas', 'Quando a senha de uma loja vaza'],
  [/confirmação além|segunda etapa/i, 'A senha não precisa ser sua única proteção', 'Uma confirmação que você não pediu'],
  [/voltar à sua conta|recuperação/i, 'Perdeu o acesso: e agora?', 'Um caminho para voltar com segurança'],
  [/sair da conta|sessões/i, 'Fechar a página não é o mesmo que sair', 'A conta que continuou aberta'],
  [/apressar|urgência/i, 'A pressa pode esconder um pedido perigoso', 'Uma mensagem com prazo para decidir'],
  [/foto não provam|remetentes/i, 'A aparência de uma mensagem pode enganar', 'Um contato conhecido, um pedido estranho'],
  [/já tiver clicado|já interagiu/i, 'O próximo passo depende do que aconteceu', 'Depois de perceber a mensagem suspeita'],
  [/atualiza/i, 'O que muda quando seu aparelho é atualizado', 'Uma atualização que apareceu fora de hora'],
  [/permiss|precisa acessar/i, 'Cada acesso precisa ter um motivo', 'O aplicativo que pediu mais do que precisava'],
  [/bloque|tela/i, 'Uma tela aberta também dá acesso', 'Alguns minutos longe do aparelho'],
  [/cópia|backup|versões/i, 'O que você conseguiria recuperar se perdesse o original?', 'Um arquivo perdido e as cópias disponíveis'],
  [/roteador/i, 'Quem controla a entrada da sua rede', 'Uma configuração que merece atenção'],
  [/DNS/i, 'Como um nome leva ao endereço de um serviço', 'O caminho de uma consulta de nomes'],
  [/TLS|certificado/i, 'O que a conexão protegida garante', 'Um aviso antes de continuar a navegação'],
  [/minimização|cadastro|dados contam/i, 'Informar menos pode proteger mais', 'Um cadastro com perguntas demais'],
  [/publicar|compartilha|foto/i, 'Quem poderá ver o que você enviou?', 'Uma informação que alcançou outro público'],
  [/malware|ransomware/i, 'Sinais de problema precisam de contexto', 'O que sabemos sobre o aparelho afetado'],
  [/autoriza|objetos|negar por padrão|papéis/i, 'Quem pode fazer o quê neste sistema?', 'Uma solicitação que precisa de permissão'],
  [/segredos|chave/i, 'Onde uma credencial pode ficar exposta', 'Uma informação que não deveria chegar ao navegador'],
  [/comandos|parametriz|injeção/i, 'Onde os dados podem virar instruções', 'Uma entrada chegando à consulta'],
  [/eventos|registros|logs/i, 'O que um registro precisa contar', 'Os detalhes que ajudam a entender um evento'],
]

export function lessonHeadings(lesson: LessonMaterial) {
  const title = lesson.title.replace(/^\d+\.\s*/, '')
  const match = topics.find(([pattern]) => pattern.test(title))
  return {
    concept: match?.[1] ?? title,
    scenario: match?.[2] ?? `Uma situação sobre ${title.charAt(0).toLowerCase() + title.slice(1)}`,
  }
}
