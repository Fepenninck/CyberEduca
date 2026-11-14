import { AchievementCelebration } from '@/components/achievement-celebration'
import type { Metadata, Viewport } from 'next'
import { SiteScrollbar } from '@/components/site-scrollbar'
import { CookieConsent } from '@/components/cookie-consent'
import './globals.css'
import '@/components/painel.css'
import './dashboard/dashboard.css'
import './student-theme.css'
import './dashboard/student-home.css'
import './student-experiences.css'
import '@/components/verificador/verificador.css'

export const metadata: Metadata = {
  title: 'CyberEduca+',
  description: 'Trilhas, aulas e conteúdos hands-on para evoluir em cybersecurity no seu ritmo.',
  generator: 'Nexora Labs',
}

export const viewport: Viewport = { colorScheme: 'dark', themeColor: '#111a14' }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR" className="bg-background"><body className="antialiased">{children}<AchievementCelebration /><SiteScrollbar /><CookieConsent /></body></html>
}
