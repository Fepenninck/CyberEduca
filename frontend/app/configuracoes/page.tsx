'use client'
import Link from 'next/link'
import { Camera, ChevronLeft } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, updateCurrentUser } from '@/lib/api'
import { DashboardNavigation } from '@/components/dashboard-navigation'
import './configuracoes.css'
import { ProfilePicture, type AvatarId } from '@/components/cyber-avatar'
import { AvatarPicker } from '@/components/avatar-picker'
import { DeleteAccountDialog } from '@/components/delete-account-dialog'
type Profile = { nome: string; email: string; foto?: string | null; avatar?: string | null }
export default function ConfiguracoesPage() {
 const router = useRouter()
 const [draftProfile, setDraftProfile] = useState<Profile>({nome:'',email:''})
 const [loading, setLoading] = useState(true)
 const [saving, setSaving] = useState(false)
 const [message, setMessage] = useState('')
 const [error, setError] = useState('')
 const [password, setPassword] = useState('')
 const [confirmation, setConfirmation] = useState('')
 const [pickerOpen, setPickerOpen] = useState(false)
 const [deleteOpen, setDeleteOpen] = useState(false)
 const [userId, setUserId] = useState('')
 const photoInput = useRef<HTMLInputElement>(null)
 useEffect(() => { getCurrentUser().then(user => { setUserId(user.id); setDraftProfile({nome:user.nome,email:user.email,foto:user.foto,avatar:user.avatar}); setLoading(false) }).catch(() => router.replace('/login')) },[router])
 async function saveSettings() {
  setMessage(''); setError('')
  if(password !== confirmation) { setError('As senhas não coincidem.'); return }
  setSaving(true)
  try {
   await updateCurrentUser({...draftProfile,...(password ? {senha:password} : {})})
   window.dispatchEvent(new Event('profile-updated'))
   setPassword(''); setConfirmation(''); setMessage('Configurações salvas com sucesso.')
  } catch(error) { setError(error instanceof Error ? error.message : 'Não foi possível salvar.') }
  finally { setSaving(false) }
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

  async function chooseAvatar(avatar: AvatarId) {
    setDraftProfile(current => ({ ...current, avatar, foto: null }))
    if (photoInput.current) photoInput.current.value = ''
    setMessage('Avatar selecionado. Salve as alterações para atualizar seu perfil.')
  }
  return (
    <main className="app-shell dashboard-page account-settings-page">
      <DashboardNavigation />
      <section className="account-settings-wrap">
        <Link className="profile-back" href="/perfil">
          <ChevronLeft size={16} /> Voltar ao perfil
        </Link>

        <header className="account-settings-heading">
          <h1>Configurações</h1>
          <p>Seu perfil e acesso, em um só lugar.</p>
        </header>

        <form
          className="profile-card profile-settings account-settings-form"
          onSubmit={event => { event.preventDefault(); void saveSettings() }}
        >
          <fieldset disabled={loading || saving}>
            <section className="settings-profile-strip" aria-labelledby="settings-photo-title">
              <span className="settings-photo-preview">
                <ProfilePicture foto={draftProfile.foto} avatar={draftProfile.avatar} iconSize={32} alt="Prévia da foto de perfil" />
              </span>
              <div className="settings-photo-copy">
                <h2 id="settings-photo-title">Foto de perfil</h2>
                <p>PNG, JPEG ou WebP. O envio é opcional.</p>
              </div>
              <div className="settings-photo-controls">
                <button className="profile-photo-button" type="button" onClick={() => photoInput.current?.click()}>
                  <Camera size={16} /> {draftProfile.foto ? 'Alterar foto' : 'Adicionar foto'}
                </button>
                <button className="profile-photo-button" type="button" onClick={() => setPickerOpen(true)}>
                  Escolher avatar
                </button>
                {draftProfile.foto && (
                  <button className="profile-remove-photo" type="button" onClick={removePhoto}>Remover foto</button>
                )}
              </div>
              <input ref={photoInput} className="profile-file-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={choosePhoto} />
            </section>

            <section className="settings-edit-row" aria-labelledby="settings-personal-title">
              <header className="settings-row-heading">
                <h2 id="settings-personal-title">Dados pessoais</h2>
                <p>Informações da sua conta.</p>
              </header>
              <div className="profile-form-grid">
                <label>
                  Nome completo
                  <input required value={draftProfile.nome} onChange={(event) => setDraftProfile({ ...draftProfile, nome: event.target.value })} autoComplete="name" />
                </label>
                <label>
                  E-mail
                  <input required type="email" value={draftProfile.email} onChange={(event) => setDraftProfile({ ...draftProfile, email: event.target.value })} autoComplete="email" />
                </label>
              </div>
            </section>

            <section className="settings-edit-row" aria-labelledby="settings-password-title">
              <header className="settings-row-heading">
                <h2 id="settings-password-title">Senha de acesso</h2>
                <p>Preencha apenas se quiser alterar sua senha.</p>
              </header>
              <div className="profile-form-grid">
                <label>
                  Nova senha
                  <input type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Digite a nova senha" autoComplete="new-password" />
                </label>
                <label>
                  Confirmar senha
                  <input type="password" value={confirmation} onChange={event => setConfirmation(event.target.value)} placeholder="Repita a nova senha" autoComplete="new-password" />
                </label>
              </div>
            </section>

            <footer className="settings-form-footer">
              <button className="dashboard-button-secondary" type="button" onClick={() => router.push('/perfil')}>Cancelar</button>
              <button className="dashboard-button-primary" type="submit">{saving ? 'Salvando...' : 'Salvar alterações'}</button>
            </footer>
          </fieldset>
          {loading && <p className="settings-feedback" role="status">Carregando...</p>}
          {message && <p className="settings-feedback" role="status">{message}</p>}
          {error && <p className="settings-feedback" role="alert">{error}</p>}
        </form>

        <section className="settings-delete-account" aria-labelledby="settings-delete-title">
          <div><h2 id="settings-delete-title">Excluir conta</h2><p>Encerre seu acesso e remova seu cadastro e histórico de aprendizagem.</p></div>
          <button type="button" disabled={loading || saving} onClick={() => setDeleteOpen(true)}>Excluir minha conta</button>
        </section>
        <nav className="settings-legal-links" aria-label="Informações legais">
          <Link href="/privacidade/politica#politica-de-privacidade">Privacidade e LGPD</Link>
          <Link href="/privacidade/politica#termos-de-uso">Termos de uso</Link>
        </nav>
      </section>
      {deleteOpen && <DeleteAccountDialog userId={userId} onClose={() => setDeleteOpen(false)} />}
      {pickerOpen && (
        <AvatarPicker
          avatarAtual={draftProfile.avatar}
          temFoto={Boolean(draftProfile.foto)}
          onEscolher={chooseAvatar}
          onRemoverFoto={async () => removePhoto()}
          onEnviarFoto={() => { setPickerOpen(false); photoInput.current?.click() }}
          onFechar={() => setPickerOpen(false)}
          confirmLabel="Usar avatar"
        />
      )}
    </main>
  )
}
