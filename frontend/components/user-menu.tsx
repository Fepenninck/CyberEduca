'use client'

import Link from 'next/link'
import { Cog, LogOut, ShieldCheck, UserRound } from 'lucide-react'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch, getCurrentUser, getCachedCurrentUser, getServerCurrentUser, subscribeCurrentUser } from '@/lib/api'
import { ProfilePicture } from '@/components/cyber-avatar'

type Profile = { nome: string; email: string; foto?: string | null; avatar?: string | null }

const defaultProfile: Profile = { nome: '', email: '' }

export function UserMenu() {
  const [open, setOpen] = useState(false)
  const profile = useSyncExternalStore(subscribeCurrentUser, getCachedCurrentUser, getServerCurrentUser) ?? defaultProfile
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const update = () => { void getCurrentUser().catch(() => undefined) }
    if (!getCachedCurrentUser()) update()
    window.addEventListener('profile-updated', update)
    return () => window.removeEventListener('profile-updated', update)
  }, [])

  useEffect(() => {
    const close = (event: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false) }
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', escape) }
  }, [])

  async function signOut() {
    await apiFetch('/auth/logout', { method: 'POST' }).catch(() => undefined)
    setOpen(false)
    router.push('/login')
    router.refresh()
  }

  return <div className="user-menu" ref={menuRef}>
    <button className="dashboard-user" type="button" aria-label="Abrir perfil" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
      <span><ProfilePicture foto={profile.foto} avatar={profile.avatar} /></span>
    </button>
    {open && <div className="user-menu-panel">
      <div className="user-menu-profile"><div className="user-menu-avatar"><ProfilePicture foto={profile.foto} avatar={profile.avatar} iconSize={28} alt="" /></div><div><strong>{profile.nome || 'Conta'}</strong><small>{profile.email || 'Dados indisponíveis'}</small></div></div>
      <span className="user-menu-label">Minha conta</span>
      <Link href="/perfil" onClick={() => setOpen(false)}><UserRound size={18} /> Perfil</Link>
      <Link href="/configuracoes" onClick={() => setOpen(false)}><Cog size={18} /> Configurações</Link>
      <div className="user-menu-divider" />
      <span className="user-menu-label">Informações legais</span>
      <Link href="/privacidade/politica" onClick={() => setOpen(false)}><ShieldCheck size={18} /> Termos e privacidade</Link>
      <div className="user-menu-divider" />
      <button className="user-menu-signout" type="button" onClick={signOut}><LogOut size={18} /> Sair da conta</button>
    </div>}
  </div>
}
