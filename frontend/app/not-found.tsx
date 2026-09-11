import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { CyberHeader } from '@/components/cyber-header'

export default function NotFound() { return <main className="app-shell"><CyberHeader /><section className="not-found"><div className="not-found-code">404</div><div className="eyebrow">Sinal não encontrado</div><h1>Essa rota saiu do radar.</h1><p>A página que você procura pode ter sido movida ou ainda não faz parte da nossa rede.</p><div><Link href="/" className="header-cta"><ArrowLeft size={16} /> Voltar ao início</Link><Link href="/trilhas" className="text-link">Explorar trilhas <ArrowRight size={16} /></Link></div></section></main> }
