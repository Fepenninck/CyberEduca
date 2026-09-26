import Link from 'next/link'
import '../footer.css'
import { CyberHeader } from '@/components/cyber-header'
import { SiteFooter } from '@/components/site-footer'

export default function TrilhasPage() {
  return (
    <main className="app-shell trilhas-page">
      <CyberHeader />
      <section className="page-hero page-hero-video">
        <video className="page-hero-video-media" autoPlay muted loop playsInline preload="metadata" aria-hidden="true">
          <source src="/trilhas-hero.mp4" type="video/mp4" />
        </video>
        <div className="page-hero-video-overlay" aria-hidden="true" />
        <div className="page-hero-content">
          <h1 className="tracks-hero-title"><span>Supere lacunas em cibersegurança.</span><span>Prepare-se para os desafios.</span></h1>
          <p className="tracks-hero-subtitle">Desenvolva e acompanhe sua evolução digital em uma única plataforma<br />de aprendizado.</p>
          <Link className="tracks-hero-cta" href="/login">Iniciar jornada</Link>
        </div>
      </section>
      <SiteFooter className="tracks-footer" />
    </main>
  )
}
