import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { SiteScrollbar } from '@/components/site-scrollbar'
import { CookieConsent } from '@/components/cookie-consent'
import './globals.css'

export const metadata: Metadata = {
  title: 'CyberEduca+',
  description: 'Trilhas, aulas e conteúdos hands-on para evoluir em cybersecurity no seu ritmo.',
  generator: 'Nexora Labs',
}

export const viewport: Viewport = { colorScheme: 'dark', themeColor: '#111a14' }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR" className="bg-background"><body className="antialiased">{children}<SiteScrollbar /><CookieConsent />{process.env.NODE_ENV === 'production' && <Analytics />}</body></html>
}
