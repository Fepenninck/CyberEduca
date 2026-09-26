'use client'

import { BellOff, Eye, FilePenLine, LockKeyhole, ShieldCheck, Trash2, UserX } from 'lucide-react'
import { DashboardNavigation } from '@/components/dashboard-navigation'

const rights = [
  { icon: Eye, title: 'Acessar meus dados', text: 'Consulte os dados pessoais e informações de uso vinculados à sua conta.' },
  { icon: FilePenLine, title: 'Corrigir dados', text: 'Atualize nome, e-mail e demais informações de cadastro.' },
  { icon: BellOff, title: 'Gerenciar consentimentos', text: 'Revise ou revogue permissões opcionais da sua conta.' },
  { icon: LockKeyhole, title: 'Bloquear ou anonimizar', text: 'Peça análise para dados desnecessários, excessivos ou incorretos.' },
  { icon: Trash2, title: 'Excluir dados pessoais', text: 'Solicite a eliminação de dados tratados com base em consentimento.' },
  { icon: UserX, title: 'Excluir conta', text: 'Solicite o encerramento da conta e a exclusão aplicável dos dados.' },
]

export default function PrivacidadePage() {
  return <main className="app-shell dashboard-page privacy-page"><DashboardNavigation />
    <section className="privacy-wrap">
      <header className="privacy-heading"><span className="eyebrow">Privacidade e dados</span><h1>Controle seus dados pessoais</h1><p className="privacy-lead">Nesta central você encontra seus direitos como titular de dados e os meios para exercer cada um deles.</p></header>
      <div className="privacy-rights">{rights.map(({ icon: Icon, title, text }) => <article key={title}><Icon size={21} /><h2>{title}</h2><p>{text}</p><button type="button" disabled>Solicitar em breve</button></article>)}</div>
      <div className="privacy-bottom"><div><h2>Transparência sobre o tratamento</h2><p>Veja quais dados são tratados, suas finalidades, compartilhamentos e os canais disponíveis para contato.</p></div></div>
      <section className="privacy-security" id="seguranca"><ShieldCheck size={22} /><div><h2>Segurança dos dados</h2><p>Seus dados devem ser protegidos com controle de acesso, autenticação, criptografia em trânsito, registros de segurança e revisão de permissões. Caso identifique atividade suspeita, altere sua senha e entre em contato com o suporte.</p></div></section>
    </section>
  </main>
}
