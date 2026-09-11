'use client'

import { useState } from 'react'
import Link from 'next/link'
import './footer.css'
import './home-hero.css'
import { BookOpen, Menu, X } from 'lucide-react'

const navigation = ['Início', 'Plataforma', 'Trilhas', 'Recursos', 'Sobre']
const panels = [
  { title: 'Aprenda a se proteger', heading: 'Conheça as ameaças. Proteja sua vida digital.', description: 'Explore trilhas e aulas sobre segurança digital. Entenda os riscos, conheça boas práticas e desenvolva hábitos para proteger suas informações.', action: 'Explorar trilhas', href: '/trilhas' },
  { title: 'Desenvolva seu conhecimento', heading: 'Um novo aprendizado a cada aula.', description: 'Comece pelos fundamentos da cibersegurança e avance pelos conteúdos no seu ritmo. Acesse módulos, descubra novos assuntos e revise o que aprendeu.', action: 'Conhecer a primeira aula', href: '/aulas/o-que-e-cybersecurity' },
  { title: 'Acompanhe sua evolução', heading: 'Visualize sua jornada de aprendizagem.', description: 'Conheça o painel de progresso do CyberEduca+ e navegue pelas suas trilhas. Nesta versão, os indicadores exibidos são demonstrativos.', action: 'Ver meu progresso', href: '/progresso' },
]
const platformMenu = {
  learner: [
    ['Trilhas de aprendizagem', 'Caminhos organizados para estudar no seu ritmo.'],
    ['Aulas e conteúdos', 'Materiais objetivos sobre segurança digital.'],
    ['Acompanhamento de progresso', 'Visualize a evolução em cada trilha.'],
    ['Histórico de desempenho', 'Consulte resultados e conteúdos concluídos.'],
  ],
  practice: [
    ['Quizzes de conhecimento', 'Avalie o que aprendeu com perguntas objetivas.'],
    ['Simulador de phishing', 'Reconheça sinais de mensagens e golpes falsos.'],
    ['Feedback de respostas', 'Entenda os acertos e pontos para melhorar.'],
    ['Proteção de dados', 'Boas práticas de privacidade e LGPD.'],
  ],
  explore: ['Fundamentos de cibersegurança', 'Proteção de contas', 'Phishing e golpes digitais', 'Privacidade e LGPD'],
}

export default function Page() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activePanel, setActivePanel] = useState(0)
  const [activeMenu, setActiveMenu] = useState(false)

  return (
    <main className="min-h-screen bg-[#080d18] text-[#f4f7fb]">
      <header className="reference-header" onMouseLeave={() => setActiveMenu(false)}>
        <div className="reference-header-inner">
          <a href="#top" className="reference-brand" aria-label="CyberEduca+ início">
            <img className="reference-logo" src="/cybereduca-logo.png" alt="CyberEduca+" />
          </a>
          <nav className="reference-nav" aria-label="Navegação principal">
            {navigation.map((item) => <a key={item} href={item === 'Trilhas' ? '/trilhas' : '#top'} onFocus={() => setActiveMenu(item === 'Plataforma')} onMouseEnter={() => setActiveMenu(item === 'Plataforma')} onKeyDown={(event) => { if (event.key === 'Escape') setActiveMenu(false) }} className={`nav-item ${activeMenu && item === 'Plataforma' ? 'active' : ''}`}>{item}</a>)}
          </nav>
          <div className="reference-actions">
            <a href="/progresso" className="nav-item">Progresso</a>
            <a href="#entrar" className="nav-item">Entrar</a>
            <a href="/trilhas" className="reference-cta">Começar</a>
          </div>
          <button className="reference-mobile-button" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={23} /> : <Menu size={23} />}</button>
        </div>
        {activeMenu && <MegaMenu />}
        {menuOpen && <nav className="reference-mobile-nav">{navigation.map((item) => <a key={item} href="#top" onClick={() => setMenuOpen(false)} className="nav-item">{item}</a>)}<a href="#comecar" className="reference-cta">Começar agora</a></nav>}
      </header>

      <section id="top" className="home-intro">
        <div className="home-intro-background" aria-hidden="true"><div className="home-intro-photo" /><div className="home-intro-blur" /><div className="home-intro-shape" /></div>
        <div className="home-intro-inner">
          <div className="home-intro-copy">
            <h1>Aprenda a se proteger<br className="home-title-break" /> no mundo digital</h1>
            <p>Desenvolva conhecimentos e boas práticas de segurança digital com trilhas e aulas que ajudam você a reconhecer ameaças e proteger suas informações.</p>
            <div className="home-intro-actions"><Link href="/trilhas" className="home-intro-primary">Explorar trilhas</Link><Link href="/progresso" className="home-intro-secondary">Meu progresso</Link></div>
          </div>
          <div className="home-intro-tabs" aria-label="Conheça a aprendizagem">{panels.map((panel, index) => <button key={panel.title} onClick={() => setActivePanel(index)} aria-pressed={activePanel === index} aria-controls="home-intro-panel">{panel.title}</button>)}</div>
          <article id="home-intro-panel" className="home-intro-panel"><div><h2>{panels[activePanel].heading}</h2><p>{panels[activePanel].description}</p><Link href={panels[activePanel].href}>{panels[activePanel].action} <span aria-hidden="true">→</span></Link></div><div className="home-intro-art" aria-hidden="true"><BookOpen size={110} strokeWidth={1} /><span>APRENDA. PRATIQUE. PROTEJA-SE.</span></div></article>
        </div>
      </section>
      <footer className="ce-footer"><div className="ce-container"><div className="ce-footer-grid"><div className="ce-footer-brand"><Link href="/" className="ce-logo" aria-label="CyberEduca+ início"><img src="/cybereduca-logo.png" alt="CyberEduca+" /></Link><p>Aprenda. Pratique. Proteja-se.<br />Educação para uma vida digital mais segura.</p></div><nav aria-label="Aprendizagem"><h2>Aprendizagem</h2><Link href="/trilhas">Todas as trilhas</Link><Link href="/trilhas/fundamentos-cybersecurity">Fundamentos</Link><Link href="/aulas/o-que-e-cybersecurity">Primeira aula</Link><Link href="/progresso">Meu progresso</Link></nav><nav aria-label="Plataforma"><h2>Plataforma</h2><Link href="/trilhas">Explorar conteúdos</Link><Link href="/progresso">Acompanhar aprendizagem</Link><span>Quizzes e simulador: em breve</span></nav></div><div className="ce-footer-bottom"><span>© 2026 CyberEduca+. Todos os direitos reservados.</span><a href="#top">Voltar ao topo ↑</a></div></div></footer>
    </main>
  )
}

function MegaMenu() {
  return <div className="mega-menu"><div className="mega-menu-inner"><section><p className="mega-label">Para aprender</p>{platformMenu.learner.map(([title, description], index) => <a href="#trilhas" className="mega-card" key={title}><span className="mega-icon">{['◈', '▣', '◌', '◫'][index]}</span><span><strong>{title}</strong><small>{description}</small></span><b>›</b></a>)}</section><section><p className="mega-label">Para praticar</p>{platformMenu.practice.map(([title, description], index) => <a href="#praticar" className="mega-card" key={title}><span className="mega-icon">{['✓', '✉', '◉', '▤'][index]}</span><span><strong>{title}</strong><small>{description}</small></span><b>›</b></a>)}</section><section className="mega-explore"><p className="mega-label">Explorar temas</p>{platformMenu.explore.map((item) => <a href="#trilhas" key={item}>{item}<b>›</b></a>)}<p className="mega-label mega-subtitle">Sobre a plataforma</p><a href="#sobre">Sobre o CyberEduca+<b>›</b></a><a href="#acessibilidade">Acessibilidade e LGPD<b>›</b></a></section></div></div>
}
