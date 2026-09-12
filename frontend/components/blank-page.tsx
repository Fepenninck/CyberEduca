import { CyberHeader } from '@/components/cyber-header'

export function BlankPage() {
  return <main className="app-shell">
    <CyberHeader />
    <section className="blank-page" aria-labelledby="em-breve-title"><div className="blank-page-content"><img src="/em-breve-ilustracao.png" alt="Ilustração de uma área em construção" /><h1 id="em-breve-title">Em breve</h1></div></section>
  </main>
}
