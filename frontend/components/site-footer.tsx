import Link from 'next/link'

export function SiteFooter({ className = '' }: { className?: string }) {
  return (
    <footer className={`ce-footer article-footer ${className}`.trim()}>
      <div className="ce-container">
        <div className="ce-footer-card">
          <div className="ce-footer-grid">
            <div className="ce-footer-brand">
              <Link href="/" className="ce-logo" aria-label="CyberEduca+ início"><img src="/cybereduca-logo.png" alt="CyberEduca+" /></Link>
              <p>Educação acessível para uma vida digital mais segura.</p>
            </div>
            <nav aria-label="Navegação">
              <h2>Navegação</h2>
              <Link href="/">Início</Link>
              <Link href="/trilhas">Trilhas</Link>
            </nav>
            <nav aria-label="Conteúdos públicos">
              <h2>Conteúdos</h2>
              <Link href="/dicas">Dicas de segurança</Link>
              <Link href="/#noticias">Notícias</Link>
            </nav>
            <nav aria-label="Privacidade">
              <h2>Privacidade</h2>
              <Link href="/politicas#politica-de-privacidade">Política de privacidade</Link>
              <Link href="/politicas#termos-de-uso">Termos de uso</Link>
            </nav>
            <nav aria-label="Suporte">
              <h2>Suporte</h2>
              <Link href="/ajuda">Ajuda</Link>
              <Link href="/cadastro">Criar conta</Link>
              <a href="https://www.instagram.com/cybereduca.ofc?stkn=MTdxY3I5MGJ5ODF3OA==" target="_blank" rel="noreferrer">Instagram</a>
            </nav>
          </div>
        </div>
        <div className="ce-footer-bottom"><span>© 2026 CyberEduca+. Todos os direitos reservados.</span><div><Link href="/politicas#politica-de-privacidade">Privacidade</Link><Link href="/politicas#cookies">Cookies</Link><Link href="/politicas#termos-de-uso">Termos de uso</Link></div></div>
      </div>
    </footer>
  )
}
