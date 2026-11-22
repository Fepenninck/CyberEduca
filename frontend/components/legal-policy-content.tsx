'use client'

import { TermsDocument, TermsIndex, TermsLastUpdated, usePublishedTerms, usePublishedPrivacy } from '@/components/published-terms'
import { parseTermsSections } from '@/lib/terms-sections'
import { CyberHeader } from '@/components/cyber-header'
import { DashboardNavigation } from '@/components/dashboard-navigation'
import { SiteFooter } from '@/components/site-footer'
import '@/app/politicas/politicas.css'
import '@/app/footer.css'

export function LegalPolicyContent({ loggedIn = false }: { loggedIn?: boolean }) {
  const { terms, error, retry } = usePublishedTerms()
  const { terms: privacy, error: privacyError, retry: retryPrivacy } = usePublishedPrivacy()
  const latest = terms && privacy ? new Date(privacy.publicadoEm) > new Date(terms.publicadoEm) ? privacy : terms : null
  const content = <>{loggedIn ? <DashboardNavigation /> : <CyberHeader />}<main className={`legal-page${loggedIn ? ' legal-page-internal' : ''}`}>
    <aside className="legal-index"><nav><h2>Termos de Uso</h2>{terms && <TermsIndex sections={parseTermsSections(terms.conteudo)} />}<h2>Privacidade e LGPD</h2>{privacy && <TermsIndex sections={parseTermsSections(privacy.conteudo, 'privacy')} />}</nav></aside>
    <div className="legal-content">
      <section className="legal-section" id="termos-de-uso"><span className="legal-eyebrow">Termos de Uso</span><h1>Condições claras para uma experiência de aprendizagem segura</h1><p className="legal-lead">Estas regras explicam como utilizar o CyberEduca+ de forma responsável, segura e compatível com sua finalidade educacional.</p>{error ? <div role="alert"><p>Não foi possível carregar os termos publicados.</p><button onClick={retry}>Tentar novamente</button></div> : terms ? <TermsDocument terms={terms} /> : <p role="status">Carregando os Termos de Uso…</p>}</section>
      <section className="legal-section legal-privacy" id="politica-de-privacidade"><span className="legal-eyebrow">Política de Privacidade e LGPD</span><h1>Transparência e controle sobre seus dados pessoais</h1><p className="legal-lead">Esta política descreve quais dados são tratados, por que são necessários, como são protegidos e como você pode exercer seus direitos.</p>{privacyError ? <div role="alert"><p>Não foi possível carregar a política de privacidade.</p><button onClick={retryPrivacy}>Tentar novamente</button></div> : privacy ? <TermsDocument terms={privacy} kind="privacy" /> : <p role="status">Carregando Privacidade e LGPD…</p>}</section>
      <TermsLastUpdated terms={latest} />
    </div>
  </main>{!loggedIn && <SiteFooter />}</>
  return loggedIn ? <div className="app-shell dashboard-page">{content}</div> : content
}

