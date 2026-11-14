import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import './simulation-back.css'

export function SimulationBack({ href = '/simulacoes' }: { href?: string }) {
  return <Link href={href} className="simulation-back-button"><ArrowLeft size={16} />Voltar às simulações</Link>
}
