import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
  title: 'CyberEduca+',
  description: 'Trilhas, aulas e conteúdos hands-on para evoluir em cybersecurity no seu ritmo.',
  generator: 'Nexora Labs',
}

export const viewport: Viewport = { colorScheme: 'dark', themeColor: '#111a14' }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR" className="bg-background"><body className={`${geist.variable} ${geistMono.variable} antialiased`}>{children}{process.env.NODE_ENV === 'production' && <Analytics />}</body></html>
}
