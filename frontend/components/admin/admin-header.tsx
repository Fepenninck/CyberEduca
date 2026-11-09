import { ShieldCheck } from 'lucide-react'

export function AdminHeader() {
  return (
    <header className="flex min-h-16 items-center justify-between border-b border-[#27364b] bg-[#0b1421]/95 px-5 sm:px-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
          Administração
        </p>
        <h1 className="mt-0.5 text-lg font-semibold text-white">Painel administrativo</h1>
      </div>
      <div className="hidden items-center gap-2 rounded-full border border-[#33445b] px-3 py-1.5 text-xs text-slate-300 sm:flex">
        <ShieldCheck aria-hidden="true" size={15} className="text-[#b2ff00]" />
        Área restrita
      </div>
    </header>
  )
}
