'use client'

import Link from 'next/link'
import { Camera, Cog, LockKeyhole, LogOut, ShieldCheck, UserRound, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type Profile = { nome: string; email: string; foto?: string }

const defaultProfile: Profile = { nome: '', email: '' }

export function getStoredProfile(): Profile {
  if (typeof window === 'undefined') return defaultProfile
  try {
    const stored = JSON.parse(localStorage.getItem('cybereduca-profile') ?? '{}') as Profile
    if (stored.nome === 'Felipe Penninck' && stored.email === 'felipe@cybereduca.com') {
      const cleanedProfile = { ...stored, nome: '', email: '' }
      localStorage.setItem('cybereduca-profile', JSON.stringify(cleanedProfile))
      return { ...defaultProfile, ...cleanedProfile }
    }
    return { ...defaultProfile, ...stored }
  } catch { return defaultProfile }
}

export function UserMenu() {
  const [open, setOpen] = useState(false)
  const [profile, setProfile] = useState<Profile>(defaultProfile)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [draftProfile, setDraftProfile] = useState<Profile>(defaultProfile)
  const menuRef = useRef<HTMLDivElement>(null)
  const photoInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const update = () => setProfile(getStoredProfile())
    update()
    window.addEventListener('storage', update)
    return () => window.removeEventListener('storage', update)
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

  function saveSettings() {
    localStorage.setItem('cybereduca-profile', JSON.stringify(draftProfile))
    setProfile(draftProfile)
    setSettingsOpen(false)
  }

  function choosePhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setDraftProfile((current) => ({ ...current, foto: String(reader.result) }))
    reader.readAsDataURL(file)
  }

  function removePhoto() {
    setDraftProfile((current) => ({ ...current, foto: undefined }))
    if (photoInput.current) photoInput.current.value = ''
  }

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
      <div className="user-menu-profile"><div className="user-menu-avatar">{profile.foto ? <img src={profile.foto} alt="" /> : <UserRound size={28} />}</div><div><strong>{profile.nome || 'Conta'}</strong><small>{profile.email || 'Dados indisponíveis'}</small></div></div>
      <span className="user-menu-label">Minha conta</span>
      <Link href="/perfil" onClick={() => setOpen(false)}><UserRound size={18} /> Perfil</Link>
      <button className="user-menu-action" type="button" onClick={openSettings}><Cog size={18} /> Configurações</button>
      <div className="user-menu-divider" />
      <span className="user-menu-label">Privacidade e segurança</span>
      <Link href="/privacidade" onClick={() => setOpen(false)}><ShieldCheck size={18} /> Privacidade e dados</Link>
      <Link href="/privacidade/politica" onClick={() => setOpen(false)}><ShieldCheck size={18} /> Segurança dos dados</Link>
      <div className="user-menu-divider" />
      <Link className="user-menu-signout" href="/" onClick={() => { sessionStorage.clear(); setOpen(false) }}><LogOut size={18} /> Sair da conta</Link>
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
