'use client'

import { useState } from 'react'
import Link from 'next/link'
import './footer.css'
import './home-hero.css'
import { Menu, X } from 'lucide-react'

const navigation = [
  { label: 'Início', href: '/' },
  { label: 'Plataforma', href: '/em-breve' },
  { label: 'Trilhas', href: '/trilhas' },
  { label: 'Recursos', href: '/em-breve' },
  { label: 'Sobre', href: '/em-breve' },
]
const panels = [
  { title: 'Aprenda a se proteger', heading: 'Conheça as ameaças. Proteja sua vida digital.', description: 'Explore trilhas e aulas sobre segurança digital. Entenda os riscos, conheça boas práticas e desenvolva hábitos para proteger suas informações.', features: [['Reconheça ameaças digitais', 'Aprenda a identificar golpes, fraudes e comportamentos suspeitos.'], ['Proteja suas informações', 'Adote práticas simples para manter contas e dados pessoais seguros.'], ['Navegue com mais segurança', 'Tome decisões mais conscientes em sua rotina digital.']] },
  { title: 'Desenvolva seu conhecimento', heading: 'Um novo aprendizado a cada aula.', description: 'Comece pelos fundamentos da cibersegurança e avance pelos conteúdos no seu ritmo. Acesse módulos, descubra novos assuntos e revise o que aprendeu.', features: [['Conteúdo direto e acessível', 'Conceitos importantes explicados de maneira clara e objetiva.'], ['Trilhas organizadas', 'Evolua dos fundamentos até temas mais avançados.'], ['Aprendizado no seu ritmo', 'Estude quando quiser e retome exatamente de onde parou.']] },
  { title: 'Acompanhe sua evolução', heading: 'Visualize sua jornada de aprendizagem.', description: 'Conheça o painel de progresso do CyberEduca+ e navegue pelas suas trilhas. Os indicadores ajudam você a manter o ritmo e celebrar cada conquista.', features: [['Progresso por trilha', 'Veja rapidamente o quanto você já avançou em cada tema.'], ['Histórico de aprendizagem', 'Acompanhe aulas, módulos e conteúdos concluídos.'], ['Próximos passos', 'Descubra o que estudar em seguida para continuar evoluindo.']] },
]

export default function Page() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activePanel, setActivePanel] = useState(0)
  const panel = panels[activePanel]

  return <main className="home-page">
    <header className="reference-header">
      <div className="reference-header-inner">
        <a href="#top" className="reference-brand" aria-label="CyberEduca+ início"><img className="reference-logo" src="/cybereduca-logo.png" alt="CyberEduca+" /></a>
        <nav className="reference-nav" aria-label="Navegação principal">{navigation.map((item) => <a key={item.label} href={item.href} className="nav-item">{item.label}</a>)}</nav>
        <div className="reference-actions"><a href="/progresso" className="nav-item">Progresso</a><a href="/em-breve" className="nav-item">Entrar</a><a href="/trilhas" className="reference-cta">Começar</a></div>
        <button className="reference-mobile-button" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={23} /> : <Menu size={23} />}</button>
      </div>
      {menuOpen && <nav className="reference-mobile-nav">{navigation.map((item) => <a key={item.label} href={item.href} onClick={() => setMenuOpen(false)} className="nav-item">{item.label}</a>)}<a href="/trilhas" className="reference-cta">Começar agora</a></nav>}
    </header>

    <section id="top" className="home-intro">
      <div className="home-intro-background" aria-hidden="true"><div className="home-intro-shape" /><div className="home-intro-photo" /><div className="home-intro-photo home-intro-photo-lower" /><div className="home-intro-line home-intro-line-top" /><div className="home-intro-line home-intro-line-bottom" /><div className="home-intro-dots" /></div>
      <div className="home-intro-inner">
        <div className="home-intro-copy"><h1>Aprenda a se proteger<br className="home-title-break" /> no mundo digital</h1><p>Desenvolva conhecimentos e boas práticas de segurança digital com trilhas e aulas que ajudam você a reconhecer ameaças e proteger suas informações.</p><div className="home-intro-actions"><Link href="/trilhas" className="home-intro-primary">Explorar trilhas</Link><Link href="/progresso" className="home-intro-secondary">Meu progresso</Link></div></div>
        <div className="home-intro-tabs" aria-label="Conheça a aprendizagem">{panels.map((item, index) => <button key={item.title} onClick={() => setActivePanel(index)} aria-pressed={activePanel === index} aria-controls="home-intro-panel">{item.title}</button>)}</div>
        <article id="home-intro-panel" className="home-intro-panel"><div className="home-intro-panel-copy"><h2>{panel.heading}</h2><p>{panel.description}</p><div className="home-intro-features">{panel.features.map(([title, description]) => <div className="home-intro-feature" key={title}><strong>{title}</strong><span>{description}</span></div>)}</div></div><div className="home-intro-art" aria-label="Ilustração da seção">{activePanel === 0 ? <img className="home-intro-art-image" src="/aprenda-a-se-proteger.png" alt="Pessoa usando um notebook protegida por um escudo digital" /> : activePanel === 1 ? <img className="home-intro-art-image" src="/desenvolva-seu-conhecimento.png" alt="Pessoa estudando conteúdos de cibersegurança" /> : activePanel === 2 ? <img className="home-intro-art-image" src="/acompanhe-sua-evolucao.png" alt="Pessoa acompanhando seu progresso em segurança digital" /> : <div className="image-placeholder"><span>Imagem em breve</span><small>Ilustração desta seção</small></div>}</div></article>
        <section className="partner-marquee" aria-label="Organizações e comunidades de segurança digital">
          <div className="partner-marquee-track">
            {[...['logo-github.png', 'logo-owasp.png', 'logo-lets-encrypt.png', 'logo-lgpd.png'], ...['logo-github.png', 'logo-owasp.png', 'logo-lets-encrypt.png', 'logo-lgpd.png']].map((logo, index) => <img key={`${logo}-${index}`} src={`/${logo}`} alt="" aria-hidden="true" />)}
          </div>
        </section>
      </div>
    </section>

    <footer className="ce-footer"><div className="ce-container"><div className="ce-footer-grid"><div className="ce-footer-brand"><Link href="/" className="ce-logo" aria-label="CyberEduca+ início"><img src="/cybereduca-logo.png" alt="CyberEduca+" /></Link><p>Aprenda. Pratique. Proteja-se.<br />Educação para uma vida digital mais segura.</p></div><nav aria-label="Aprendizagem"><h2>Aprendizagem</h2><Link href="/trilhas">Todas as trilhas</Link><Link href="/trilhas/fundamentos-cybersecurity">Fundamentos</Link><Link href="/aulas/o-que-e-cybersecurity">Primeira aula</Link><Link href="/progresso">Meu progresso</Link></nav><nav aria-label="Plataforma"><h2>Plataforma</h2><Link href="/trilhas">Explorar conteúdos</Link><Link href="/progresso">Acompanhar aprendizagem</Link><span>Quizzes e simulador: em breve</span></nav></div><div className="ce-footer-bottom"><span>© 2026 CyberEduca+. Todos os direitos reservados.</span><a href="#top">Voltar ao topo ↑</a></div></div></footer>
  </main>
}
