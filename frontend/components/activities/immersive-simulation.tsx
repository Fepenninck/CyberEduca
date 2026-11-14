'use client'

import { useState, type ReactNode } from 'react'
import { Monitor, Smartphone, Folder, FileText, Wifi, Shield, Settings, Terminal, Code, ChevronLeft, Search, Lock } from 'lucide-react'
import type { QuestaoTreino } from '@/lib/simulacoes-api'
import './immersive-simulation.css'

type Props = { title: string; category: string; decision: QuestaoTreino; step: number; selected?: string; disabled: boolean; onChoose: (id: string) => void }
type Option = QuestaoTreino['alternativas'][number]
const normal = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

// Labels describe operations, not their correctness. The server still grades the original option ID.
export function operationLabel(text: string) {
  const rules: Array<[RegExp, string]> = [
    [/loja do aparelho/, 'Abrir loja do aparelho'], [/instalar o arquivo/, 'Baixar versão do anúncio'], [/desativar as prote/, 'Desativar proteção'],
    [/recusar acessos/, 'Recusar permissões'], [/permitir tudo/, 'Permitir tudo'], [/permitir os contatos/, 'Permitir contatos'],
    [/nas configura/, 'Atualizar pelo sistema'], [/primeira janela/, 'Instalar pela janela'], [/nunca atualizar/, 'Adiar todas as atualizações'],
    [/abrir o servico/, 'Abrir minha conta'], [/enviando sua senha/, 'Responder com senha de demonstração'], [/ignorar/, 'Ignorar aviso'],
    [/encerrar o acesso/, 'Encerrar sessão e redefinir senha'], [/trocar somente a foto|apenas o nome/, 'Editar perfil'], [/anotar o nome/, 'Manter sessão ativa'],
    [/ativar a confirma/, 'Ativar proteção e atualizar recuperação'], [/desativar todos os avisos/, 'Desativar avisos de entrada'], [/compartilhar a senha nova/, 'Compartilhar senha de demonstração'],
    [/remover a aprova/, 'Remover aprovação de pagamentos'], [/dar acesso de administrador/, 'Tornar administrador'], [/manter todos os acessos/, 'Manter permissões atuais'],
    [/migrar a automa/, 'Criar identidade para automação'], [/publicar a senha/, 'Publicar senha de demonstração'], [/permanentemente ativa/, 'Manter conta compartilhada'],
    [/revisar sessoes/, 'Revogar acessos antigos'], [/presumir/, 'Encerrar sem revisar'],
    [/isolar o aparelho/, 'Desconectar rede e abrir incidente'], [/conectar um disco/, 'Conectar disco de backup'], [/enviar o programa/, 'Encaminhar arquivo à equipe'],
    [/informar horario/, 'Enviar relato com horário e sintomas'], [/apenas que o computador/, 'Informar apenas lentidão'], [/apagar tudo/, 'Apagar arquivos antes de avisar'],
    [/restaurar/, 'Restaurar cópia verificada'], [/pagar/, 'Pagar exigência simulada'],
    [/refazer ou recortar/, 'Recortar e revisar público'], [/documento esta no fundo/, 'Publicar foto completa'], [/apagar depois/, 'Publicar e apagar depois'],
    [/retirar endereco/, 'Remover endereço e horários'], [/trocar uma letra/, 'Trocar uma letra do endereço'], [/acrescentar mais/, 'Adicionar detalhes da viagem'],
    [/revisar a marcacao/, 'Revisar marcação e pedir autorização'], [/marcar todos/, 'Marcar todos os contatos'], [/toda foto publicada/, 'Republicar sem consultar'],
    [/manter somente os dados/, 'Remover colunas desnecessárias'], [/adicionar mais dados/, 'Adicionar dados ao documento'], [/copia aberta/, 'Criar cópia pública'],
    [/revogar acessos desnecessarios/, 'Revogar pessoas e links antigos'], [/manter acessos para sempre/, 'Manter todos os acessos'], [/arquivar o atalho/, 'Arquivar somente o atalho'],
    [/confirmar com o estabelecimento/, 'Perguntar a rede no balcão'], [/nome mais parecido/, 'Conectar a Café da Praça Grátis'], [/sinal mais forte/, 'Conectar pela intensidade do sinal'],
    [/nao informar a senha/, 'Fechar página e confirmar no balcão'], [/mesma senha do e-mail/, 'Enviar senha de demonstração'], [/mes seguinte/, 'Enviar agora e trocar depois'],
    [/desativar a conexao automatica/, 'Desativar conexão automática'], [/permitir todas as conexoes/, 'Ativar conexão automática'], [/compartilhar a senha do e-mail/, 'Compartilhar senha de demonstração'],
    [/criar uma rede de convidados/, 'Criar rede de convidados isolada'], [/senha administrativa do roteador/, 'Compartilhar acesso administrativo'], [/mesma pasta compartilhada/, 'Liberar pasta interna aos visitantes'],
    [/trocar a senha administrativa/, 'Proteger painel e atualizar firmware'], [/apenas o nome da rede/, 'Renomear rede'], [/publicar o painel/, 'Abrir gerenciamento pela internet'],
    [/corrigir o isolamento/, 'Corrigir isolamento e testar novamente'], [/internet funciona/, 'Aprovar pelo acesso à internet'], [/dois nomes/, 'Aprovar pelos nomes das redes'],
    [/avisar o canal/, 'Abrir incidente e proteger a conta'], [/esperar/, 'Aguardar novas ocorrências'], [/reenviar o link/, 'Reenviar link à equipe'],
    [/revoga-la/, 'Revogar sessão suspeita'], [/resolvido apenas/, 'Encerrar caso após trocar senha'], [/apagar o historico/, 'Limpar histórico do navegador'],
    [/horarios e fatos/, 'Enviar relatório dos fatos'], [/senha completa/, 'Incluir senha de demonstração'], [/acusando/, 'Enviar mensagem sem evidências'],
    [/correlacionando/, 'Investigar identidade, origem e volume'], [/falha confirmada do disco/, 'Classificar como falha de disco'], [/incidente descartado/, 'Descartar alerta'],
    [/revogar ou rotacionar/, 'Rotacionar credencial e preservar evidências'], [/copiar a credencial/, 'Reutilizar chave suspeita'], [/apagar os logs/, 'Apagar registros'],
    [/testar a negacao/, 'Executar validação de escopo'], [/tarefa legitima/, 'Encerrar pelo teste permitido'], [/desativar os alertas/, 'Desativar detecção'],
    [/verificar no servidor/, 'Aplicar autorização por documento'], [/ocultar o botao/, 'Ocultar botão no cliente'], [/trocar o identificador/, 'Substituir ID por UUID'],
    [/derivar a identidade/, 'Usar identidade da sessão validada'], [/aceitar proprietarioId/i, 'Confiar no proprietário enviado'], [/formato valido/, 'Validar somente formato'],
    [/confirmar que outro usuario/, 'Testar acesso de outro usuário'], [/somente se o botao/, 'Testar existência do botão'], [/usuario administrador/, 'Testar apenas como administrador'],
    [/consulta parametrizada/, 'Aplicar consulta parametrizada'], [/remover apenas espacos/, 'Remover espaços da entrada'], [/validacao do formulario/, 'Validar somente no navegador'],
    [/validar faixa e tipo/, 'Validar quantidade e identidade'], [/qualquer numero/, 'Aceitar qualquer número'], [/usuarioId=7/, 'Usar usuário enviado no corpo'],
    [/identificador de correlacao/, 'Registrar operação sem segredos'], [/todos os segredos/, 'Registrar senha e token fictícios'], [/desativar qualquer registro/, 'Desativar logs'],
  ]
  return rules.find(([pattern]) => pattern.test(normal(text)))?.[1] ?? text
}

function Action({ option, props, children, after }: { option: Option; props: Props; children?: ReactNode; after?: () => void }) {
  return <button type="button" className="scene-operation" disabled={props.disabled} aria-pressed={props.selected === option.id} title={option.texto} onClick={() => { props.onChoose(option.id); after?.() }}>{children || operationLabel(option.texto)}</button>
}
function Actions({ props }: { props: Props }) { return <div className="scene-operations">{props.decision.alternativas.map(option => <Action key={option.id} option={option} props={props} />)}</div> }
function Evidence({ props }: { props: Props }) { return <div className="scene-evidence">{props.decision.contexto?.split('\n').slice(1).map((line, i) => <p key={i}>{line}</p>)}</div> }
function Effect({ props }: { props: Props }) {
  const option = props.decision.alternativas.find(value => value.id === props.selected)
  if (!option) return null
  const text = normal(option.texto)
  let heading = 'Operação realizada no ambiente'
  let detail = operationLabel(option.texto)
  if (/loja do aparelho/.test(text)) { heading = 'Loja do aparelho aberta'; detail = 'Lanterna Fácil · Luz Apps · Origem e permissões disponíveis para revisão.' }
  else if (/instalar o arquivo|desativar as prote/.test(text)) { heading = 'Instalador externo aberto'; detail = 'lanterna-especial.apk está solicitando instalação fora da loja. Proteção do aparelho: alteração solicitada.' }
  else if (/recusar acessos/.test(text)) { heading = 'Permissões recusadas'; detail = 'Contatos: bloqueados · Mensagens: bloqueadas · Câmera: bloqueada.' }
  else if (/permitir tudo|permitir os contatos/.test(text)) { heading = 'Acesso concedido ao aplicativo'; detail = /permitir tudo/.test(text) ? 'A lanterna agora pode ler contatos e mensagens e acessar a câmera neste celular fictício.' : 'A lanterna agora pode ler a lista de contatos deste celular fictício.' }
  else if (/nas configura/.test(text)) { heading = 'Atualização do sistema iniciada'; detail = 'Origem: configurações do aparelho. Versão de demonstração instalada.' }
  else if (/primeira janela/.test(text)) { heading = 'Instalador da janela iniciado'; detail = 'Origem: navegador. Um programa externo solicitou permissão para alterar o aparelho fictício.' }
  else if (/nunca atualizar/.test(text)) { heading = 'Atualização adiada'; detail = 'O aparelho continua com a versão anterior e as correções pendentes.' }
  else if (/isolar o aparelho/.test(text)) { heading = 'Computador desconectado da rede'; detail = 'Pasta compartilhada: indisponível. Incidente aberto para a equipe responsável.' }
  else if (/conectar um disco/.test(text)) { heading = 'Disco de backup conectado'; detail = 'A cópia de segurança ficou acessível ao computador que ainda apresenta arquivos bloqueados.' }
  else if (/enviar o programa|reenviar o link/.test(text)) { heading = 'Mensagem encaminhada'; detail = 'O conteúdo suspeito foi distribuído para outros participantes da equipe fictícia.' }
  else if (/encerrar o acesso|revoga-la|revisar sessoes/.test(text)) { heading = 'Acesso revogado'; detail = 'A sessão selecionada não pode mais consultar a conta fictícia. As outras sessões continuam sob revisão.' }
  else if (/remover a aprova/.test(text)) { heading = 'Permissões de Marina atualizadas'; detail = 'Atendimento: permitido · Aprovar pagamentos: removido.' }
  else if (/dar acesso de administrador/.test(text)) { heading = 'Função atualizada: administrador'; detail = 'Marina passou a ter permissões amplas, incluindo operações fora da função de Atendimento.' }
  else if (/criar uma rede de convidados/.test(text)) { heading = 'Rede de convidados criada'; detail = 'Visitante → Internet: permitido. Visitante → arquivos da equipe: bloqueado.' }
  else if (/mesma pasta compartilhada/.test(text)) { heading = 'Pasta interna liberada'; detail = 'Os visitantes agora podem consultar os arquivos da equipe no ambiente fictício.' }
  else if (/confirmar com o estabelecimento/.test(text)) { heading = 'Resposta do balcão'; detail = 'Nossa rede é Café da Praça. Não pedimos a senha do seu e-mail.' }
  else if (/nome mais parecido|sinal mais forte/.test(text)) { heading = 'Portal de conexão aberto'; detail = 'A rede escolhida pede a senha do seu e-mail para liberar a navegação.' }
  else if (/nao informar a senha/.test(text)) { heading = 'Portal fechado'; detail = 'Nenhum dado foi enviado. O estabelecimento foi consultado para confirmar o procedimento.' }
  else if (/senha|token/.test(text) && /enviar|informar|compartilhar|publicar|incluir|registrar todos/.test(text)) { heading = 'Dados de demonstração enviados'; detail = 'Uma senha ou credencial fictícia foi incluída na operação. Em uma ocorrência real, o destinatário teria acesso a esse dado.' }
  else if (/recortar/.test(text)) { heading = 'Imagem revisada'; detail = 'O documento pessoal foi retirado do enquadramento. A publicação ficou pronta para revisar o público.' }
  else if (/publicar porque|apagar depois/.test(text)) { heading = 'Publicação disponível no perfil'; detail = 'O documento com nome e endereço ficou visível para o público da postagem.' }
  else if (/retirar endereco/.test(text)) { heading = 'Texto da publicação atualizado'; detail = 'Endereço e horários foram removidos antes da postagem.' }
  else if (/revogar acessos desnecessarios/.test(text)) { heading = 'Compartilhamento atualizado'; detail = 'Link antigo: revogado · Ex-colaborador: removido · Equipe atual: acesso mantido.' }
  else if (/consulta parametrizada/.test(text)) { heading = 'Consulta alterada'; detail = 'A entrada agora é enviada como parâmetro, separada do comando SQL.' }
  else if (/verificar no servidor|derivar a identidade/.test(text)) { heading = 'Controle aplicado no servidor'; detail = 'GET /api/documentos/42 → 403 para o usuário 18. O documento de outro proprietário não foi retornado.' }
  return <div className="scene-live-effect" role="status"><span>Resultado da operação</span><strong>{heading}</strong><p>{detail}</p></div>
}
function WindowBar({ children }: { children: ReactNode }) { return <div className="scene-window-bar"><span className="scene-window-dots" aria-hidden="true"><i /><i /><i /></span><strong>{children}</strong><span>Ambiente educativo</span></div> }

function PhoneScene({ props }: { props: Props }) {
  const [details, setDetails] = useState(false)
  return <div className="scene-phone-desk"><div className="scene-phone"><div className="scene-phone-status"><span>09:41</span><span>Wi-Fi · 100%</span></div><div className="scene-phone-screen"><div className="scene-phone-nav"><ChevronLeft size={18} /><strong>{['Loja de aplicativos', 'Privacidade do aplicativo', 'Atualizações'][props.step] || 'Meu celular'}</strong></div>
    {props.step === 0 ? <><div className="scene-app-banner"><span>LF</span><h2>Lanterna Fácil</h2><p>Utilitários · Luz Apps</p></div><button className="scene-text-button" type="button" onClick={() => setDetails(value => !value)}>Ver desenvolvedor e detalhes</button>{details && <div className="scene-phone-info">Desenvolvedor: Luz Apps<br />Função: usar a luz do celular<br />Outra oferta: versão especial por arquivo em um anúncio.</div>}<div className="scene-sponsored"><small>Patrocinado</small><strong>Versão especial fora da loja</strong><span>Baixar lanterna-especial.apk</span></div></> : props.step === 1 ? <div className="scene-permission-dialog"><span className="scene-app-small">LF</span><h2>Permitir acesso a seus dados?</h2>{['Contatos', 'Mensagens', 'Câmera'].map(name => <div key={name} className="scene-permission-row"><span>{name}</span><Lock size={15} /></div>)}<p>Solicitado por Lanterna Fácil</p></div> : <><div className="scene-system-update"><Settings size={36} /><h2>Nova versão disponível</h2><p>Atualização nas configurações do sistema</p></div><div className="scene-browser-ad"><small>Janela do navegador</small><strong>Atualizador especial disponível!</strong><p>Um instalador oferece uma atualização por fora do sistema.</p></div></>}
    <Actions props={props} /><Effect props={props} /></div><div className="scene-phone-home" /></div><div className="scene-desk-note"><Smartphone size={24} /><h3>Você está com o celular de Ana</h3><p>Use os controles da tela para instalar, permitir ou atualizar como faria no dia a dia.</p><small>Os dados e o aparelho são fictícios.</small></div></div>
}

function DesktopScene({ props }: { props: Props }) {
  const [file, setFile] = useState('')
  return <div className="scene-desktop"><div className="scene-desktop-icons"><span><Monitor />Este computador</span><span><Folder />Documentos</span><span><Shield />Segurança</span></div><div className="scene-files-window"><WindowBar>Explorador de arquivos — Documentos</WindowBar><div className="scene-file-address">Este computador / Documentos</div><div className="scene-file-list">{['relatorio.pdf.locked', 'orcamento.xlsx.locked', 'fotos.zip.locked'].map(name => <button key={name} type="button" onClick={() => setFile(name)}><FileText size={27} /><span>{name}</span><small>Arquivo bloqueado</small></button>)}</div>{file && <div className="scene-file-error" role="status">Não foi possível abrir {file}. O formato foi alterado.</div>}</div><div className="scene-ransom-window"><WindowBar>Aviso encontrado no computador</WindowBar><div><Lock size={30} /><h2>Seus arquivos foram bloqueados</h2><Evidence props={props} /><Actions props={props} /><Effect props={props} /></div></div><div className="scene-taskbar"><span>Iniciar</span><Folder size={18} /><Monitor size={18} /><span>Documentos · computador de demonstração</span></div></div>
}

function AccountScene({ props, team }: { props: Props; team: boolean }) {
  const [inspected, setInspected] = useState(false)
  return <div className={`scene-account ${team ? 'scene-admin' : ''}`}><div className="scene-account-brand"><Shield size={22} /><strong>{team ? 'Equipe / Administração' : 'MinhaConta'}</strong><span>{team ? 'Administrador' : 'Ana Exemplo'}</span></div><div className="scene-account-layout"><aside>{(team ? ['Pessoas', 'Funções', 'Automações', 'Sessões'] : ['Visão geral', 'Segurança', 'Dispositivos', 'Recuperação']).map((name, i) => <span key={name} className={i === props.step + (team ? 0 : 1) ? 'active' : ''}>{name}</span>)}</aside><section><small>{team ? 'CONTROLE DE ACESSO' : 'SEGURANÇA DA CONTA'}</small><h2>{team ? ['Marina · mudança de equipe', 'Automação de relatórios', 'Revisão dos acessos'][props.step] : ['Uma entrada diferente foi detectada', 'Dispositivos conectados', 'Proteja as próximas entradas'][props.step]}</h2><div className="scene-account-alert"><Evidence props={props} /></div><button className="scene-text-button" type="button" onClick={() => setInspected(value => !value)}>{team ? 'Inspecionar permissões de Marina' : 'Ver detalhes do aparelho'}</button>{inspected && <div className="scene-account-detail">{team ? 'Função atual: Atendimento. Permissão anterior ainda ativa: aprovar pagamentos. Existem sessões e automações vinculadas à conta pessoal.' : 'Aparelho: não reconhecido. Entrada registrada às 03:14. Sua sessão atual continua conectada.'}</div>}<Actions props={props} /><Effect props={props} /></section></div></div>
}

function SocialScene({ props }: { props: Props }) {
  const [crop, setCrop] = useState(false)
  const [audience, setAudience] = useState('Público')
  const executed = normal(props.decision.alternativas.find(option => option.id === props.selected)?.texto || '')
  const cropped = crop || executed.includes('recortar')
  return <div className="scene-social"><header><strong>Conecta</strong><span>Publicações</span><span>Ana Exemplo</span></header><div className="scene-social-feed"><aside><span>Ana Exemplo</span><span>Meu perfil</span><span>Fotos</span><span>Marcações</span></aside><section><div className="scene-post-author"><span>AE</span><div><strong>Ana Exemplo</strong><select aria-label="Público da publicação" value={audience} onChange={event => setAudience(event.target.value)}><option>Público</option><option>Amigos</option><option>Somente eu</option></select></div></div><p>{props.step === 1 ? 'Preparando uma viagem! Minha casa ficará vazia durante uma semana.' : props.step === 2 ? 'Uma pessoa marcou você nesta foto.' : 'Um dia de estudos por aqui.'}</p><div className={`scene-post-photo ${cropped ? 'cropped' : ''}`}><div className="scene-illustrated-laptop"><span>Meu projeto</span></div>{!cropped && <div className="scene-illustrated-document">Ana Exemplo<br />Rua Fictícia, 123<br /><small>Documento pessoal</small></div>}</div><div className="scene-photo-tools"><button type="button" disabled={cropped} onClick={() => { setCrop(true); const operation = props.decision.alternativas.find(option => normal(option.texto).includes('recortar')); if (operation) props.onChoose(operation.id) }}>{cropped ? 'Imagem recortada' : 'Recortar imagem'}</button><span>Visibilidade: {audience}</span></div><Evidence props={props} /><Actions props={props} /><Effect props={props} /></section></div></div>
}

function DriveScene({ props }: { props: Props }) {
  const [open, setOpen] = useState(false)
  return <div className="scene-drive"><header><Folder size={23} /><strong>Arquivos da equipe</strong><span><Search size={15} />Buscar em arquivos</span></header><div className="scene-drive-layout"><aside><strong>Meu espaço</strong><span>Compartilhados</span><span>Recentes</span><span>Arquivados</span></aside><section><h2>Projeto / Relatório da semana</h2><div className="scene-drive-file"><FileText size={36} /><div><strong>pedidos-da-semana.xlsx</strong><small>Proprietário: Ana Exemplo · compartilhado por link</small></div><button type="button" onClick={() => setOpen(value => !value)}>Ver acesso</button></div><div className="scene-sheet"><div>Nome</div><div>E-mail</div><div>Pedido</div><div>Dados adicionais</div><span>Ana Exemplo</span><span>ana@exemplo.invalid</span><span>Projeto A</span><span>Endereço pessoal</span></div>{open && <div className="scene-access-popover"><h3>Pessoas com acesso</h3><p>Equipe do projeto · editor</p><p>Ex-colaborador · editor</p><p>Qualquer pessoa com o link · leitor</p></div>}<Evidence props={props} /><Actions props={props} /><Effect props={props} /></section></div></div>
}

function CafeScene({ props }: { props: Props }) {
  const [network, setNetwork] = useState('')
  const [board, setBoard] = useState(false)
  return <div className="scene-cafe"><div className="scene-cafe-sign"><span>CAFÉ DA PRAÇA</span><h2>Uma pausa para o café.</h2><p>Enquanto espera seu pedido, você quer se conectar à internet.</p><button type="button" onClick={() => setBoard(value => !value)}>Consultar a placa do balcão</button>{board && <div role="status">Rede do estabelecimento: <strong>Café da Praça</strong><br />Não pedimos a senha do seu e-mail.</div>}</div><div className="scene-wifi-panel"><div><Wifi size={22} /><h3>{props.step === 1 ? 'Entrar na rede' : 'Wi-Fi'}</h3></div>{props.step === 1 ? <div className="scene-captive-portal"><h2>Libere seu acesso</h2><p>Confirme sua conta de e-mail para navegar.</p><label>E-mail de demonstração<input value="ana@exemplo.invalid" readOnly /></label><label>Senha de demonstração<input value="senha-ficticia" type="password" readOnly /></label></div> : ['Café da Praça', 'Café da Praça Grátis'].map(name => <button className="scene-network-choice" type="button" key={name} onClick={() => setNetwork(name)}><Wifi size={18} /><span>{name}</span><small>{network === name ? 'Selecionada' : 'Disponível'}</small></button>)}<Evidence props={props} /><Actions props={props} /><Effect props={props} /></div></div>
}

function RouterScene({ props }: { props: Props }) {
  const [test, setTest] = useState(false)
  const segmented = normal(props.decision.alternativas.find(option => option.id === props.selected)?.texto || '').includes('rede de convidados isolada')
  return <div className="scene-router"><aside><Wifi size={27} /><strong>NetControl</strong><span>Estado da rede</span><span>Wireless</span><span className="active">Convidados</span><span>Administração</span></aside><section><div className="scene-router-address">Painel local / 192.0.2.1</div><h2>Configuração da rede de convidados</h2><div className="scene-network-map"><div>Internet</div><i /><div>Roteador</div><i /><div>{segmented ? 'Equipe / Convidados separados' : 'Equipe + Convidados'}<br /><small>{segmented ? 'Pasta interna bloqueada' : 'Pasta interna acessível'}</small></div></div><Evidence props={props} /><button type="button" className="scene-test-button" onClick={() => setTest(true)}>Testar acesso como visitante</button>{test && <pre className="scene-router-test" role="status">Internet: OK{'\n'}Pasta da equipe: {segmented ? 'BLOQUEADA' : 'ACESSÍVEL'}{'\n'}Isolamento entre redes: {segmented ? 'ATIVO' : 'NÃO CONFIRMADO'}</pre>}<Actions props={props} /><Effect props={props} /></section></div>
}

function IncidentScene({ props, technical }: { props: Props; technical: boolean }) {
  const [inspected, setInspected] = useState(false)
  return technical ? <div className="scene-soc"><header><Shield size={21} /><strong>Centro de operações</strong><span>Incidente #1042</span></header><div className="scene-soc-layout"><aside><span>Alertas ativos</span><strong>01</strong><p>Volume fora do padrão</p><small>Credencial svc-export</small><button type="button" onClick={() => setInspected(value => !value)}>Abrir inventário</button>{inspected && <p>Escopo esperado: rede interna. Dependências: tarefa noturna e exportação manual.</p>}</aside><section><h2>{['Eventos correlacionados', 'Contenção da credencial', 'Validação da recuperação'][props.step]}</h2><pre className="scene-event-log">{props.decision.contexto?.split('\n').slice(1).join('\n')}</pre><Actions props={props} /><Effect props={props} /></section></div></div> : <div className="scene-chat"><aside><strong>Equipe / Atendimento</strong><span># geral</span><span className="active"># incidentes</span><span># suporte</span></aside><section><header># incidentes <span>Canal interno</span></header><div className="scene-chat-message"><span>AE</span><div><strong>Ana · 10:15</strong><p>Abri um link e informei minha senha. Depois percebi que o endereço era diferente.</p></div></div><div className="scene-chat-message"><span>TI</span><div><strong>Suporte · 10:16</strong><Evidence props={props} /></div></div><button className="scene-text-button" type="button" onClick={() => setInspected(value => !value)}>Ver atividade da conta</button>{inspected && <div className="scene-chat-session">Sessão desconhecida · criada às 10:14 · ativa</div>}<div className="scene-chat-compose"><span>Responder ao incidente</span><Actions props={props} /><Effect props={props} /></div></section></div>
}

function IdeScene({ props }: { props: Props }) {
  const [patch, setPatch] = useState(false)
  const [test, setTest] = useState('')
  const sql = props.title === 'Entrada, consulta e registro'
  return <div className="scene-ide"><header><Code size={20} /><strong>cyberedu / {sql ? 'pedidos.ts' : 'documentos.ts'}</strong><span>Workspace local</span></header><div className="scene-ide-layout"><aside><span>EXPLORADOR</span><span>src</span><strong>{sql ? 'pedidos.ts' : 'documentos.ts'}</strong><span>testes.spec.ts</span></aside><section><div className="scene-editor-tab">{sql ? 'pedidos.ts' : 'documentos.ts'} <small>TypeScript</small></div><pre className="scene-code-editor">{props.decision.contexto?.split('\n').slice(1).join('\n')}{patch ? '\n\n// Prévia de alteração\n' + (sql ? 'db.query("SELECT * FROM pedidos WHERE nome = $1", [entrada]);' : 'where: { id: params.id, proprietarioId: sessao.usuarioId }') : ''}</pre><div className="scene-ide-tools"><button type="button" onClick={() => { setPatch(value => !value); setTest('') }}>{patch ? 'Desfazer prévia' : 'Prévia de correção'}</button><button type="button" onClick={() => setTest(patch ? 'PASS · tentativa fora do escopo rejeitada\nPASS · operação permitida preservada' : 'FAIL · operação fora do escopo foi aceita\nRevise o controle aplicado no servidor.')}>Executar testes locais</button></div><div className="scene-terminal-heading"><Terminal size={14} />TERMINAL · MODELO EDUCATIVO</div><pre className="scene-test-output" role="status">{test || 'Selecione uma alteração e execute os testes. Nenhum código é executado em sistemas externos.'}</pre><div className="scene-patch-actions"><span>Aplicar alteração ao exercício</span><Actions props={props} /><Effect props={props} /></div></section></div></div>
}

export function ImmersiveSimulation(props: Props) {
  const chosen = props.decision.alternativas.find(option => option.id === props.selected)
  const title = props.title
  let environment: ReactNode
  if (title === 'Antes de instalar, decida') environment = <PhoneScene props={props} />
  else if (title === 'Os arquivos pararam de abrir') environment = <DesktopScene props={props} />
  else if (props.category === 'Contas e acesso') environment = <AccountScene props={props} team={title === 'A conta de quem mudou de equipe'} />
  else if (title === 'Compartilhar sem expor') environment = <SocialScene props={props} />
  else if (props.category === 'Privacidade') environment = <DriveScene props={props} />
  else if (title === 'Conectar fora de casa') environment = <CafeScene props={props} />
  else if (props.category === 'Redes e conexões') environment = <RouterScene props={props} />
  else if (props.category === 'Resposta a incidentes') environment = <IncidentScene props={props} technical={title === 'Do alerta à contenção'} />
  else if (props.category === 'Código seguro') environment = <IdeScene props={props} />
  else environment = <div className="scene-custom"><Evidence props={props} /><Actions props={props} /></div>
  return <div className="immersive-simulation"><div className="scene-mission"><p>{props.decision.contexto?.split('\n')[0] || props.title}</p><small>Use os controles do ambiente para agir. Tudo acontece somente aqui.</small></div>{environment}{chosen && <div className="scene-action-receipt" role="status"><strong>Operação registrada neste cenário</strong><p>{chosen.texto}</p><span>Você pode alterar sua ação antes de continuar.</span></div>}</div>
}
