'use client'

import Link from 'next/link'
import { Camera, Cog, LockKeyhole, LogOut, ShieldCheck, UserRound, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch, getCurrentUser, updateCurrentUser } from '@/lib/api'

type Profile = { nome: string; email: string; foto?: string | null }

const defaultProfile: Profile = { nome: '', email: '' }

export function UserMenu() {
  const [open, setOpen] = useState(false)
  const [profile, setProfile] = useState<Profile>(defaultProfile)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [draftProfile, setDraftProfile] = useState<Profile>(defaultProfile)
  const menuRef = useRef<HTMLDivElement>(null)
  const photoInput = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    const update = () => getCurrentUser()
      .then((user) => setProfile({ nome: user.nome, email: user.email, foto: user.foto }))
      .catch(() => setProfile(defaultProfile))
    update()
    window.addEventListener('profile-updated', update)
    return () => window.removeEventListener('profile-updated', update)
  }, [])

  useEffect(() => {
    window.addEventListener('open-account-settings', openSettings)
    return () => window.removeEventListener('open-account-settings', openSettings)
  })

  function openSettings() {
    setDraftProfile(profile)
    setOpen(false)
    setSettingsOpen(true)
  }

  async function saveSettings() {
    const updated = await updateCurrentUser(draftProfile)
    setProfile({ nome: updated.nome, email: updated.email, foto: updated.foto })
    setSettingsOpen(false)
    window.dispatchEvent(new Event('profile-updated'))
  }

  function choosePhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const image = new Image()
      image.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = canvas.height = 320
        const size = Math.min(image.width, image.height)
        const sourceX = (image.width - size) / 2
        const sourceY = (image.height - size) / 2
        canvas.getContext('2d')?.drawImage(image, sourceX, sourceY, size, size, 0, 0, 320, 320)
        setDraftProfile((current) => ({ ...current, foto: canvas.toDataURL('image/jpeg', .82) }))
      }
      image.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  }

  function removePhoto() {
    setDraftProfile((current) => ({ ...current, foto: null }))
    if (photoInput.current) photoInput.current.value = ''
  }

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
      <span>{profile.foto ? <img src={profile.foto} alt="Foto de perfil" /> : <UserRound size={18} />}</span>
    </button>
    {open && <div className="user-menu-panel">
      <div className="user-menu-profile"><div className="user-menu-avatar">{profile.foto ? <img src={profile.foto} alt="" /> : <UserRound size={28} />}</div><div><strong>{profile.nome || 'Conta'}</strong><small>{profile.email || 'Dados indisponíveis'}</small></div></div>
      <span className="user-menu-label">Minha conta</span>
      <Link href="/perfil" onClick={() => setOpen(false)}><UserRound size={18} /> Perfil</Link>
      <button className="user-menu-action" type="button" onClick={openSettings}><Cog size={18} /> Configurações</button>
      <div className="user-menu-divider" />
      <span className="user-menu-label">Privacidade e segurança</span>
      <Link href="/privacidade" onClick={() => setOpen(false)}><ShieldCheck size={18} /> Privacidade e dados</Link>
      <Link href="/privacidade/politica" onClick={() => setOpen(false)}><ShieldCheck size={18} /> Segurança dos dados</Link>
      <div className="user-menu-divider" />
      <button className="user-menu-signout" type="button" onClick={signOut}><LogOut size={18} /> Sair da conta</button>
    </div>}
    {settingsOpen && <div className="profile-settings-backdrop" role="dialog" aria-modal="true" aria-labelledby="quick-settings-title">
      <article className="profile-card profile-settings profile-settings-modal">
        <button className="profile-modal-close" type="button" onClick={() => setSettingsOpen(false)} aria-label="Fechar configurações"><X size={20} /></button>
        <div className="profile-settings-heading"><div><h2 id="quick-settings-title">Configurações da conta</h2><p>Atualize suas informações sem sair da página atual.</p></div></div>
        <div className="profile-form-grid"><label>Nome completo<input value={draftProfile.nome} onChange={(event) => setDraftProfile({ ...draftProfile, nome: event.target.value })} autoComplete="name" /></label><label>E-mail<input type="email" value={draftProfile.email} onChange={(event) => setDraftProfile({ ...draftProfile, email: event.target.value })} autoComplete="email" /></label><label>Nova senha<input type="password" placeholder="Deixe em branco para não alterar" autoComplete="new-password" /></label><label>Confirmar nova senha<input type="password" placeholder="Repita a nova senha" autoComplete="new-password" /></label></div>
        <div className="profile-photo-actions"><button className="profile-photo-button" type="button" onClick={() => photoInput.current?.click()}><Camera size={16} /> {draftProfile.foto ? 'Alterar foto' : 'Adicionar foto'}</button>{draftProfile.foto && <button className="profile-remove-photo" type="button" onClick={removePhoto}>Remover foto</button>}<input ref={photoInput} className="profile-file-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={choosePhoto} /></div>
        <div className="profile-privacy"><LockKeyhole size={18} /><div><strong>Privacidade e proteção de dados</strong><p>Nome e e-mail são usados para identificar e dar acesso à sua conta.</p></div></div>
        <div className="profile-modal-actions"><button type="button" onClick={() => setSettingsOpen(false)}>Cancelar</button><button type="button" onClick={saveSettings}>Salvar</button></div>
      </article>
    </div>}
  </div>
}
