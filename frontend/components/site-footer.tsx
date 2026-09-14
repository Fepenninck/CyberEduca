import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="ce-footer article-footer">
      <div className="ce-container">
        <div className="ce-footer-card">
          <div className="ce-footer-grid">
            <div className="ce-footer-brand"><Link href="/" className="ce-logo" aria-label="CyberEduca+ início"><img src="/cybereduca-logo.png" alt="CyberEduca+" /></Link><p>Educação acessível para uma vida digital mais segura.</p></div>
            <nav aria-label="Aprendizagem"><h2>Aprendizagem</h2><Link href="/trilhas">Todas as trilhas</Link><Link href="/progresso">Meu progresso</Link></nav>
            <nav aria-label="Conteúdos"><h2>Conteúdos</h2><Link href="/trilhas">Explorar conteúdos</Link><Link href="/em-breve">Recursos</Link></nav>
            <nav aria-label="Privacidade"><h2>Privacidade</h2><Link href="/em-breve">Política de privacidade</Link><Link href="/em-breve">Termos de uso</Link></nav>
            <nav aria-label="Conecte-se"><h2>Conecte-se</h2><a href="https://www.instagram.com/cybereduca.ofc?stkn=MTdxY3I5MGJ5ODF3OA==" target="_blank" rel="noreferrer">Instagram</a><Link href="/em-breve">Ajuda</Link></nav>
          </div>
        </div>
        <div className="ce-footer-bottom"><span>© 2026 CyberEduca+. Todos os direitos reservados.</span><div><Link href="/em-breve">Privacidade</Link><Link href="/em-breve">Cookies</Link><Link href="/em-breve">Termos de uso</Link></div></div>
      </div>
    </footer>
  )
}
