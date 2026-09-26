import { DashboardNavigation } from '@/components/dashboard-navigation'

type Section = 'simulacoes' | 'avaliacoes'

export function InternalComingSoon({ section }: { section: Section }) {
  return <main className="app-shell dashboard-page">
    <DashboardNavigation active={section} />
    <section className="blank-page dashboard-coming-soon" aria-labelledby="em-breve-title"><div className="blank-page-content"><img src="/em-breve-ilustracao.png" alt="Ilustração de uma área em construção" /><h1 id="em-breve-title">Em breve</h1></div></section>
  </main>
}
