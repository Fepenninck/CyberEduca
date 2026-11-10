import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowDown, ArrowUpRight, BookOpen, ShieldCheck, Target } from 'lucide-react'
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
  { name: 'Thiago dos Santos', fullName: 'Thiago dos Santos Soares', photo: '/fundadores/thiago.png', bio: 'Thiago dos Santos é um dos criadores do CyberEduca+. Sua história no projeto se conecta ao primeiro passo de quem começa a aprender: transformar dúvidas em conhecimento. Ao lado de Caio e Felipe, faz parte da construção de uma plataforma em que a segurança digital pode ser compreendida com clareza, uma descoberta de cada vez.' },
  { name: 'Caio Nascimento', fullName: 'Caio Miranda do Nascimento', photo: '/fundadores/caio.png', bio: 'Caio Nascimento faz parte do trio que deu vida ao CyberEduca+. Sua trajetória nessa criação se encontra com a proposta de aprender fazendo: sair da explicação e chegar às situações que aparecem no cotidiano. Junto de Thiago e Felipe, participa de um projeto que aproxima o estudo da identificação de golpes e das escolhas que fazemos online.' },
  { name: 'Felipe Penninck', fullName: 'Luís Felipe Penninck dos Santos', photo: '/fundadores/felipe.png', bio: 'Felipe Penninck é cofundador e criador do CyberEduca+. Sua participação nessa história faz parte da passagem de uma ideia compartilhada para uma experiência de aprendizagem. Com Thiago e Caio, integra a criação de um espaço que reúne conteúdo, prática e progresso, convidando cada pessoa a continuar evoluindo em sua vida digital.' },
]

const values = [
  { icon: BookOpen, number: '01', title: 'Conhecimento acessível', text: 'Explicações claras para quem está começando e uma jornada organizada para continuar aprendendo.' },
  { icon: ShieldCheck, number: '02', title: 'Prática com propósito', text: 'Simulações e situações do cotidiano que ajudam a reconhecer golpes e tomar decisões mais seguras.' },
  { icon: Target, number: '03', title: 'Evolução contínua', text: 'Quizzes, avaliações e acompanhamento de progresso para transformar o estudo em aprendizado.' },
]

export default function SobrePage() {
  return <main className="about-page">
    <CyberHeader />

    <section className="about-hero" aria-labelledby="about-title">
      <div className="about-hero-grid" aria-hidden="true" />
      <div className="about-container about-hero-content">
        <p className="about-eyebrow"><span /> CONHEÇA O CYBEREDUCA+</p>
        <h1 id="about-title">Um mundo digital<br />mais seguro começa<br />com <em>conhecimento.</em></h1>
        <p className="about-lead">Três criadores. Uma ideia em comum: aproximar a educação em cibersegurança da vida de cada pessoa.</p>
        <a href="#nossa-historia" className="about-text-link">Conheça nossa história <ArrowDown size={18} /></a>
      </div>
      <div className="about-orbit" aria-hidden="true"><div /><div /><ShieldCheck strokeWidth={1} /></div>
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

    <section className="about-mission" aria-labelledby="mission-title">
      <div className="about-container"><p className="about-eyebrow">NOSSO PROPÓSITO</p><h2 id="mission-title">Transformar informação<br />em <em>proteção no dia a dia.</em></h2><p className="about-section-description">Acreditamos que aprender cibersegurança deve fazer sentido fora da tela de uma aula. Estes são os pilares da nossa plataforma.</p>
        <div className="about-values">{values.map(({ icon: Icon, number, title, text }) => <article key={number}><div className="about-value-top"><Icon size={30} strokeWidth={1.5} /><span>{number}</span></div><h3>{title}</h3><p>{text}</p></article>)}</div>
      </div>
    </section>

    <section id="criadores" className="about-container about-founders" aria-labelledby="founders-title">
      <div className="about-section-heading"><h2 id="founders-title">Conheça nossos fundadores</h2></div>
      <div className="about-founder-grid">{founders.map(founder => <FounderCard founder={founder} key={founder.name} />)}</div>
      <p className="about-founders-note">Juntos, Thiago, Caio e Felipe criaram o CyberEduca+ para conectar estudo, prática e conscientização sobre segurança digital.</p>
    </section>

    <section className="about-container about-invite"><div><p className="about-eyebrow">O PRÓXIMO PASSO É SEU</p><h2>Faça parte de um futuro<br />digital <em>mais seguro.</em></h2><p>Comece a aprender, pratique e acompanhe sua evolução.</p></div><Link href="/cadastro" className="about-primary-link">Começar minha jornada <ArrowUpRight size={20} /></Link></section>
    <SiteFooter />
  </main>
}
