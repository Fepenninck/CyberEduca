import type { Metadata } from 'next'
import Link from 'next/link'
import { CyberHeader } from '@/components/cyber-header'
import { SiteFooter } from '@/components/site-footer'
import { FounderCard } from '@/components/founder-card'
import '../footer.css'
import './sobre.css'

export const metadata: Metadata = {
  title: 'Sobre nós | CyberEduca+',
  description: 'Conheça a ideia por trás do CyberEduca+ e seus criadores: Thiago dos Santos, Caio Nascimento e Felipe Penninck.',
}

const founders = [
  { name: 'Thiago dos Santos', fullName: 'Thiago dos Santos Soares', photo: '/fundadores/thiago.png', role: 'Cofundador & Educação Digital', bio: 'Cofundador do CyberEduca+, Thiago dos Santos atua no desenvolvimento de soluções voltadas à aprendizagem e à avaliação de conhecimentos. Sua contribuição fortalece a proposta da plataforma de oferecer uma educação digital interativa, acessível e focada na evolução dos usuários.' },
  { name: 'Felipe Penninck', fullName: 'Luís Felipe Penninck dos Santos', photo: '/fundadores/felipe.png', role: 'Fundador & Idealizador', bio: 'À frente do CyberEduca+, Felipe Penninck é um dos responsáveis pela visão e desenvolvimento da plataforma. Sua proposta é transformar a educação em cibersegurança, unindo tecnologia, inovação e conhecimento para criar uma experiência de aprendizagem acessível, moderna e preparada para os desafios do mundo digital.' },
  { name: 'Caio Nascimento', fullName: 'Caio Miranda do Nascimento', photo: '/fundadores/caio.png', role: 'Cofundador & Segurança', bio: 'Cofundador do CyberEduca+, Caio Nascimento atua com foco na segurança digital e na prevenção de ameaças virtuais. Sua contribuição fortalece o compromisso da plataforma em promover conhecimento, conscientização e boas práticas para uma navegação mais segura.' },
]

const values = [
  { title: 'Comunidade', text: 'Conectar pessoas que querem aprender, compartilhar experiências e construir um mundo digital mais seguro.', photo: '/sobre/comunidade.jpg', alt: 'Colegas aprendendo juntos em um notebook' },
  { title: 'Aprender na prática', text: 'Transformar o aprendizado em experiência com desafios, quizzes e simulações de situações do dia a dia.', photo: '/sobre/pratica.jpg', alt: 'Grupo reunido em torno de um computador para resolver uma atividade' },
  { title: 'Conteúdo que aproxima', text: 'Tornar a cibersegurança acessível com conteúdos claros e conhecimento que faz diferença na sua vida digital.', photo: '/sobre/conteudo.jpg', alt: 'Duas pessoas compartilhando conhecimentos enquanto usam um notebook' },
]
export default function SobrePage() {
  return <main className="about-page">
    <CyberHeader />

    <section className="about-hero" aria-labelledby="about-title">
      <div className="about-container about-hero-content">
        <h1 id="about-title">Um mundo digital mais seguro<br />começa com <em>conhecimento.</em></h1>
        <p className="about-lead">Três criadores. Uma ideia em comum: aproximar a educação em cibersegurança da vida de cada pessoa.</p>
      </div>
      <div className="about-container about-facts">
        <div><strong>Educação</strong><span>para entender o mundo digital</span></div>
        <div><strong>Prática</strong><span>para reconhecer ameaças</span></div>
        <div><strong>Autonomia</strong><span>para fazer escolhas seguras</span></div>
      </div>
    </section>

    <section id="nossa-historia" className="about-container about-story" aria-labelledby="story-title">
      <div><p className="about-eyebrow">QUEM SOMOS</p><h2 id="story-title">Uma ideia que nasceu<br />para <em>proteger pessoas.</em></h2></div>
      <div className="about-story-copy"><p>Contas, mensagens, compras e informações pessoais fazem parte da nossa rotina online. Mas reconhecer um golpe ou saber como proteger esses dados ainda pode parecer complicado.</p><p>O CyberEduca+ nasceu para tornar esse aprendizado mais próximo, prático e acessível. A proposta é reunir trilhas, aulas, quizzes, avaliações e simulações de phishing em uma experiência que conecta conhecimento à realidade.</p><p>Criado por Thiago dos Santos, Caio Nascimento e Felipe Penninck, o CyberEduca+ nasceu de uma ideia compartilhada: unir tecnologia e educação para ajudar mais pessoas a navegar com segurança. Juntos, os três transformaram essa proposta em uma plataforma dedicada ao aprendizado e à proteção no mundo digital.</p></div>
    </section>

    <section className="about-mission" aria-label="Os pilares do CyberEduca+">
      <div className="about-container about-values">
        {values.map(({ title, text, photo, alt }) => <article key={title}>
          <div className="about-value-copy"><h3>{title}</h3><p>{text}</p></div>
          <img src={photo} alt={alt} width={1000} height={1120} loading="lazy" />
        </article>)}
      </div>
    </section>
    <section id="criadores" className="about-container about-founders" aria-labelledby="founders-title">
      <div className="about-section-heading"><h2 id="founders-title">Conheça nossos fundadores</h2></div>
      <div className="about-founder-grid">{founders.map(founder => <FounderCard founder={founder} key={founder.name} />)}</div>
      <p className="about-founders-note">Juntos, Thiago, Caio e Felipe criaram o CyberEduca+ para conectar estudo, prática e conscientização sobre segurança digital.</p>
    </section>

    <section className="about-container about-invite"><div><p className="about-eyebrow">O PRÓXIMO PASSO É SEU</p><h2>Faça parte de um futuro<br />digital <em>mais seguro.</em></h2><p>Comece a aprender, pratique e acompanhe sua evolução.</p></div><Link href="/login" className="about-primary-link">Começar minha jornada</Link></section>
    <SiteFooter />
  </main>
}
