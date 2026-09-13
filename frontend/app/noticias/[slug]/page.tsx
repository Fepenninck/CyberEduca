import Link from 'next/link'
import { notFound } from 'next/navigation'
import { NewsHeader } from '@/components/news-header'
import '../../article.css'

const articles = {
  'phishing-passkeys-microsoft-365': {
    category: 'Phishing',
    title: 'Golpes de phishing imitam passkeys e roubam contas Microsoft 365',
    image: '/noticia-phishing.jpg',
    alt: 'Circuitos digitais em vermelho',
    intro: 'Grupos de cibercrime estão usando páginas falsas de passkey e login único para enganar usuários, comprometer contas corporativas e roubar dados armazenados no Microsoft 365.',
    lesson: 'Uma página convincente não é prova de legitimidade. Antes de informar credenciais, valide o endereço e o contexto da solicitação.',
  },
  'zero-day-chrome': {
    category: 'Vulnerabilidade',
    title: 'Google corrige nova falha zero-day explorada no Chrome',
    image: '/noticia-chrome.jpg',
    alt: 'Logotipo do Google Chrome sobre elementos digitais',
    intro: 'O Google corrigiu a CVE-2026-87491, vulnerabilidade que já estava sendo explorada em ataques reais. Foi a sétima falha zero-day do Chrome corrigida pela empresa em 2026.',
    lesson: 'Atualizações de segurança são uma camada essencial de proteção. Mantenha navegador, sistema e aplicativos atualizados.',
  },
} as const

export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = articles[slug as keyof typeof articles]
  if (!article) notFound()

  return <main className="article-page">
    <NewsHeader />
    <article className="article-content">
      <nav className="article-breadcrumb" aria-label="Caminho da página"><Link href="/">Início</Link><span>•</span><Link href="/#noticias">Notícias</Link><span>•</span><span>{article.category}</span></nav>
      <p className="article-category">{article.category} <span>•</span> 11/09/2026</p>
      <h1>{article.title}</h1>
      <p className="article-byline"><strong>Publicado em 11/09/2026</strong> <span>•</span> Fonte: CyberEduca+</p>
      <p>{article.intro}</p>
      <figure className="article-figure"><img src={article.image} alt={article.alt} /><figcaption>Imagem ilustrativa.</figcaption></figure>
      <h2>O que aconteceu?</h2>
      <p>O caso reforça como ameaças digitais podem explorar falhas de processo, comportamento ou atualização. Acompanhar alertas de segurança ajuda a identificar riscos antes que eles causem impactos maiores.</p>
      <h2>Como se proteger?</h2>
      <p>Desconfie de solicitações inesperadas, confirme informações em canais oficiais e mantenha seus dispositivos atualizados. Essas práticas reduzem a exposição a ataques comuns.</p>
      <section className="article-learning" aria-labelledby="learning-title"><p>O que você aprendeu?</p><h2 id="learning-title">{article.lesson}</h2><p>Informação e hábitos seguros são parte essencial da proteção no mundo digital.</p></section>
      <p className="article-source"><Link href="/#noticias">← Voltar para as notícias</Link></p>
    </article>
  </main>
}
