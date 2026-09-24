'use client'

import Link from 'next/link'
import { Home, LogOut, ShieldCheck, UserRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type Profile = { nome: string; email: string; foto?: string }

const defaultProfile: Profile = { nome: 'Felipe Penninck', email: 'felipe@cybereduca.com' }

export function getStoredProfile(): Profile {
  if (typeof window === 'undefined') return defaultProfile
  try { return { ...defaultProfile, ...JSON.parse(localStorage.getItem('cybereduca-profile') ?? '{}') } } catch { return defaultProfile }
}

export function UserMenu() {
  const [open, setOpen] = useState(false)
  const [profile, setProfile] = useState<Profile>(defaultProfile)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const update = () => setProfile(getStoredProfile())
    update()
    window.addEventListener('storage', update)
    return () => window.removeEventListener('storage', update)
  }, [])

  useEffect(() => {
    const close = (event: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false) }
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', escape) }
  }, [])

  return <div className="user-menu" ref={menuRef}>
    <button className="dashboard-user" type="button" aria-label="Abrir perfil" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
      <span>{profile.foto ? <img src={profile.foto} alt="Foto de perfil" /> : <UserRound size={18} />}</span>
    </button>
    {open && <div className="user-menu-panel">
      <div className="user-menu-profile">
        <div className="user-menu-avatar">{profile.foto ? <img src={profile.foto} alt="" /> : <UserRound size={28} />}</div>
        <div><strong>{profile.nome}</strong><small>{profile.email}</small></div>
      </div>
      <span className="user-menu-label">Perfil</span>
      <Link href="/dashboard" onClick={() => setOpen(false)}><Home size={18} /> Início</Link>
      <Link href="/perfil" onClick={() => setOpen(false)}><UserRound size={18} /> Perfil</Link>
      <div className="user-menu-divider" />
      <span className="user-menu-label">Configurações da conta</span>
      <Link href="/perfil" onClick={() => setOpen(false)}><UserRound size={18} /> Configurações do usuário</Link>
      <Link href="/em-breve" onClick={() => setOpen(false)}><ShieldCheck size={18} /> Configurações de segurança</Link>
      <div className="user-menu-divider" />
      <Link className="user-menu-signout" href="/" onClick={() => { sessionStorage.clear(); setOpen(false) }}><LogOut size={18} /> Sair da conta</Link>
    </div>}
  </div>
}
