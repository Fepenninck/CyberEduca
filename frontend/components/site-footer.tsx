import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="ce-footer article-footer">
      <div className="ce-container">
        <div className="ce-footer-card">
          <div className="ce-footer-grid">
            <div className="ce-footer-brand"><Link href="/" className="ce-logo" aria-label="CyberEduca+ início"><img src="/cybereduca-logo.png" alt="CyberEduca+" /></Link><p>Educação acessível para uma vida digital mais segura.</p></div>
            <nav aria-label="Aprendizagem"><h2>Aprendizagem</h2><Link href="/trilhas">Todas as trilhas</Link><Link href="/dashboard">Meu dashboard</Link></nav>
            <nav aria-label="Conteúdos"><h2>Conteúdos</h2><Link href="/trilhas">Explorar conteúdos</Link><Link href="/em-breve">Recursos</Link></nav>
            <nav aria-label="Privacidade"><h2>Privacidade</h2><Link href="/politicas#politica-de-privacidade">Política de privacidade</Link><Link href="/politicas#termos-de-uso">Termos de uso</Link></nav>
            <nav aria-label="Conecte-se"><h2>Conecte-se</h2><a href="https://www.instagram.com/cybereduca.ofc?stkn=MTdxY3I5MGJ5ODF3OA==" target="_blank" rel="noreferrer">Instagram</a><Link href="/em-breve">Ajuda</Link></nav>
          </div>
        </div>
        <div className="ce-footer-bottom"><span>© 2026 CyberEduca+. Todos os direitos reservados.</span><div><Link href="/politicas#politica-de-privacidade">Privacidade</Link><Link href="/politicas#cookies">Cookies</Link><Link href="/politicas#termos-de-uso">Termos de uso</Link></div></div>
      </div>
    </footer>
  )
}
