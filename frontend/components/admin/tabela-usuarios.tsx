import type { AdminUsuario } from '@/lib/admin-api'

type TabelaUsuariosProps = {
  usuarios: AdminUsuario[]
}

function formatarData(data: string) {
  const valor = new Date(data)
  return Number.isNaN(valor.getTime())
    ? '—'
    : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(valor)
}

export function TabelaUsuarios({ usuarios }: TabelaUsuariosProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#29394f] bg-[#101b2a]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead className="bg-[#152235] text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th scope="col" className="px-5 py-4 font-semibold">Nome</th>
              <th scope="col" className="px-5 py-4 font-semibold">Email</th>
              <th scope="col" className="px-5 py-4 font-semibold">Papel</th>
              <th scope="col" className="px-5 py-4 font-semibold">Data de criação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#29394f]">
            {usuarios.map((usuario) => (
              <tr key={usuario.id} className="transition hover:bg-white/[0.025]">
                <td className="px-5 py-4 font-medium text-white">{usuario.nome}</td>
                <td className="px-5 py-4 text-slate-300">{usuario.email}</td>
                <td className="px-5 py-4">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${usuario.papel === 'ADMIN' ? 'bg-[#b2ff00]/10 text-[#c8ff5e]' : 'bg-slate-700/60 text-slate-300'}`}>
                    {usuario.papel}
                  </span>
                </td>
                <td className="px-5 py-4 text-slate-400">{formatarData(usuario.criadoEm)}</td>
              </tr>
            ))}
            {usuarios.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center text-slate-400">Nenhum usuário encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
