'use client'

import { useState } from 'react'
import Link from 'next/link'
import './footer.css'
import './home-hero.css'
import { Menu } from 'lucide-react'

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
  const [activePanel, setActivePanel] = useState<number | null>(null)
  const panel = panels[activePanel ?? 0]
  const togglePanel = (index: number) => {
    const closing = activePanel === index
    setActivePanel(closing ? null : index)
    if (!closing && window.matchMedia('(max-width: 600px)').matches) window.setTimeout(() => document.getElementById('home-intro-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  return <main className="home-page">
    <header className="reference-header">
      <div className="reference-header-inner">
        <a href="#top" className="reference-brand" aria-label="CyberEduca+ início"><img className="reference-logo" src="/cybereduca-logo.png" alt="CyberEduca+" /></a>
        <nav className="reference-nav" aria-label="Navegação principal">{navigation.map((item) => <a key={item.label} href={item.href} className="nav-item">{item.label}</a>)}</nav>
        <div className="reference-actions"><a href="/dashboard" className="nav-item">Dashboard</a><a href="/login" className="reference-cta">Entrar</a></div>
        <details className="reference-mobile-menu"><summary className="reference-mobile-button" aria-label="Abrir menu"><Menu className="mobile-menu-icon" preserveAspectRatio="none" /></summary><nav className="reference-mobile-nav">{navigation.map((item) => <a key={item.label} href={item.href} className="nav-item">{item.label}</a>)}<a href="/trilhas" className="reference-cta">Começar agora</a></nav></details>
      </div>
    </header>

    <section id="top" className="home-intro">
      <div className="home-intro-background" aria-hidden="true"><div className="home-intro-shape" /><div className="home-intro-photo" /><div className="home-intro-photo home-intro-photo-lower" /><div className="home-intro-line home-intro-line-top" /><div className="home-intro-line home-intro-line-bottom" /><div className="home-intro-dots" /></div>
      <div className="home-intro-inner">
        <div className="home-intro-copy"><h1>Aprenda a se proteger<br className="home-title-break" /> no mundo digital</h1><p>Desenvolva conhecimentos e boas práticas de segurança digital com trilhas e aulas que ajudam você a reconhecer ameaças e proteger suas informações.</p><div className="home-intro-actions"><Link href="/trilhas" className="home-intro-primary">Explorar trilhas</Link><Link href="/dashboard" className="home-intro-secondary">Meu dashboard</Link></div></div>
        <div className="home-intro-tabs" aria-label="Conheça a aprendizagem">{panels.map((item, index) => <button key={item.title} onPointerUp={(event) => { event.preventDefault(); togglePanel(index) }} aria-pressed={activePanel === index} aria-controls="home-intro-panel">{item.title}</button>)}</div>
        <div className="home-mobile-accordions" aria-label="Conheça a aprendizagem">{panels.map((item, index) => <details key={item.title}><summary>{item.title}</summary><div className="home-mobile-accordion-body"><div className="home-mobile-accordion-content"><h2>{item.heading}</h2><p>{item.description}</p><div className="home-mobile-accordion-features">{item.features.map(([title, description]) => <div key={title}><strong>{title}</strong><span>{description}</span></div>)}</div><img src={index === 0 ? '/aprenda-a-se-proteger.png' : index === 1 ? '/desenvolva-seu-conhecimento.png' : '/acompanhe-sua-evolucao.png'} alt="" /></div></div></details>)}</div>
        <article id="home-intro-panel" className={`home-intro-panel${activePanel !== null ? ' is-open' : ''}`}><div className="home-intro-panel-copy"><h2>{panel.heading}</h2><p>{panel.description}</p><div className="home-intro-features">{panel.features.map(([title, description]) => <div className="home-intro-feature" key={title}><strong>{title}</strong><span>{description}</span></div>)}</div></div><div className="home-intro-art" aria-label="Ilustração da seção">{(activePanel ?? 0) === 0 ? <img className="home-intro-art-image" src="/aprenda-a-se-proteger.png" alt="Pessoa usando um notebook protegida por um escudo digital" /> : (activePanel ?? 0) === 1 ? <img className="home-intro-art-image" src="/desenvolva-seu-conhecimento.png" alt="Pessoa estudando conteúdos de cibersegurança" /> : <img className="home-intro-art-image" src="/acompanhe-sua-evolucao.png" alt="Pessoa acompanhando seu progresso em segurança digital" />}</div></article>
        <section className="partner-marquee" aria-label="Organizações e comunidades de segurança digital">
          <div className="partner-marquee-track">
            {[...['logo-github.png', 'logo-owasp.png', 'logo-lets-encrypt.png', 'logo-lgpd.png'], ...['logo-github.png', 'logo-owasp.png', 'logo-lets-encrypt.png', 'logo-lgpd.png']].map((logo, index) => <span className="partner-logo" key={`${logo}-${index}`}><img src={`/${logo}`} alt="" aria-hidden="true" /></span>)}
          </div>
        </section>
        <section id="noticias" className="cyber-news" aria-labelledby="cyber-news-title">
          <div className="cyber-news-heading">
            <h2 id="cyber-news-title">O mundo da cibersegurança</h2>
            <p>Acompanhe ataques, novas vulnerabilidades e ameaças digitais que estão acontecendo<br />no mundo real. Informação também é uma forma de proteção.</p>
          </div>
          <div className="cyber-news-grid">
            <article className="cyber-news-card">
              <div className="cyber-news-card-content"><h3>CISA confirma exploração de falha crítica da WatchGuard</h3><img src="/noticia-phishing.jpg" alt="Imagem de circuitos digitais da WatchGuard" /><span>Ransomware</span><Link href="/noticias/cisa-watchguard-ransomware" className="cyber-news-button">Ler notícia</Link></div>
            </article>
            <article className="cyber-news-card">
              <div className="cyber-news-card-content"><h3>Google corrige nova falha zero-day explorada no Chrome</h3><img src="/noticia-chrome.jpg" alt="Logotipo do Google Chrome sobre elementos digitais" /><span>Vulnerabilidade</span><Link href="/noticias/zero-day-chrome" className="cyber-news-button">Ler notícia</Link></div>
            </article>
            <article className="cyber-news-card">
              <div className="cyber-news-card-content"><h3>Revolut confirma vazamento de dados de clientes</h3><img src="/noticia-revolut.png" alt="Logotipo da Revolut na tela de um celular" /><span>Vazamento de dados</span><Link href="/noticias/revolut-exposicao-dados" className="cyber-news-button">Ler notícia</Link></div>
            </article>
          </div>
        </section>
      </div>
    </section>

    <a className="instagram-float" href="https://www.instagram.com/cybereduca.ofc?stkn=MTdxY3I5MGJ5ODF3OA==" target="_blank" rel="noreferrer" aria-label="Abrir Instagram do CyberEduca+">
      <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle className="instagram-float-dot" cx="17.3" cy="6.8" r="1" /></svg>
    </a>

    <footer className="ce-footer">
      <div className="ce-container">
        <div className="ce-footer-card">
          <div className="ce-footer-grid">
            <div className="ce-footer-brand">
              <Link href="/" className="ce-logo" aria-label="CyberEduca+ início"><img src="/cybereduca-logo.png" alt="CyberEduca+" /></Link>
              <p>Educação acessível para uma vida digital mais segura.</p>
            </div>
            <nav aria-label="Aprendizagem">
              <h2>Aprendizagem</h2>
              <Link href="/trilhas">Todas as trilhas</Link>
              <Link href="/trilhas">Fundamentos</Link>
              <Link href="/trilhas">Primeira aula</Link>
              <Link href="/dashboard">Meu dashboard</Link>
            </nav>
            <nav aria-label="Conteúdos">
              <h2>Conteúdos</h2>
              <Link href="/trilhas">Explorar conteúdos</Link>
              <Link href="/#noticias">Notícias</Link>
              <Link href="/em-breve">Recursos</Link>
              <Link href="/em-breve">Sobre o CyberEduca+</Link>
            </nav>
            <nav aria-label="Privacidade e segurança">
              <h2>Privacidade</h2>
              <Link href="/politicas#politica-de-privacidade">Política de privacidade</Link>
              <Link href="/politicas#cookies">Política de cookies</Link>
              <Link href="/politicas#termos-de-uso">Termos de uso</Link>
              <Link href="/politicas#direitos">LGPD e seus direitos</Link>
            </nav>
            <nav aria-label="Canais oficiais">
              <h2>Conecte-se</h2>
              <a href="https://www.instagram.com/cybereduca.ofc?stkn=MTdxY3I5MGJ5ODF3OA==" target="_blank" rel="noreferrer">Instagram</a>
              <Link href="/em-breve">Fale conosco</Link>
              <Link href="/em-breve">Ajuda</Link>
            </nav>
          </div>
        </div>
        <div className="ce-footer-bottom">
          <span>© 2026 CyberEduca+. Todos os direitos reservados.</span>
          <div><Link href="/politicas#politica-de-privacidade">Privacidade</Link><Link href="/politicas#cookies">Cookies</Link><Link href="/politicas#termos-de-uso">Termos de uso</Link></div>
        </div>
      </div>
    </footer>
  </main>
}
