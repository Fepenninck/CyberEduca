'use client'

import { useState } from 'react'
import './phishing-interactive.css'

export function PhishingInteractiveContent({ content, site = false }: { content: string; site?: boolean }) {
  const [destination, setDestination] = useState<string | null>(site ? 'Página apresentada no cenário' : null)
  const [notice, setNotice] = useState('')
  const [inspecting, setInspecting] = useState(false)
  const requestsAccess = /senha|login|entrar|autentica|confirm.{0,20}acesso/i.test(content)
  const parts = content.split(/((?:https?:\/\/|www\.)[^\s<>]+|\b[\w.-]+\.(?:zip|exe|pdf|docx|apk)\b)/gi)
  const sender = content.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i)?.[0]
  return <div className="phishing-interactive">
    <div className="phishing-inspection"><button type="button" aria-expanded={inspecting} onClick={() => setInspecting(value => !value)}>Inspecionar detalhes</button>{inspecting && <p>{sender ? `Endereço apresentado: ${sender}` : 'O cenário não informa um endereço de remetente completo. O nome exibido, sozinho, não confirma a origem.'}</p>}</div>
    <div className="phishing-interactive-message">{parts.map((part, index) => /^(?:https?:\/\/|www\.)/i.test(part) ? <button className="phishing-inline-link" key={index} type="button" onClick={() => { setDestination(part); setNotice('') }}>{part}</button> : /\.(?:zip|exe|pdf|docx|apk)$/i.test(part) ? <button className="phishing-attachment" key={index} type="button" onClick={() => setNotice(`O anexo ${part} tentou abrir. A execução foi simulada: nenhum arquivo foi baixado ou executado. Observe se você esperava esse documento e de onde ele veio.`)}>Anexo: {part}</button> : part)}</div>
    {destination && <section className="phishing-destination" aria-label="Página aberta dentro da simulação"><div className="phishing-fake-address">{destination}<button type="button" onClick={() => { setDestination(null); setNotice('') }} aria-label="Fechar página simulada">Fechar</button></div><div className="phishing-fake-page"><span>Destino ilustrativo · não é o serviço real</span><h3>{requestsAccess ? 'Confirme seu acesso' : 'Página aberta pela mensagem'}</h3><p>{requestsAccess ? 'Experimente o pedido de acesso com dados fictícios já preenchidos.' : 'Confira o endereço acima e volte à mensagem para verificar se você esperava este contato.'}</p>{requestsAccess && <><label>Conta de demonstração<input value="aluno@exemplo.invalid" readOnly tabIndex={-1} /></label><label>Senha de demonstração<input value="senha-ficticia" type="password" readOnly tabIndex={-1} /></label><button className="phishing-demo-submit" type="button" onClick={() => setNotice('Você enviou os dados fictícios para a página aberta pelo link. Em uma página fraudulenta, esses dados poderiam ficar com quem criou o site. Nenhuma credencial real foi solicitada ou enviada.')}>Enviar dados de demonstração</button></>}<button type="button" onClick={() => { setDestination(null); setNotice('Você fechou o destino e voltou à mensagem. Agora decida se o conteúdo é confiável.') }}>Sair sem informar dados</button></div></section>}
    {notice && <p className="phishing-interaction-notice" role="status">{notice}</p>}
  </div>
}
