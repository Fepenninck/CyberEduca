'use client'

import { useEffect, useState } from 'react'
import { Camera, Check, X } from 'lucide-react'
import { AVATARES, CyberAvatar, type AvatarId } from '@/components/cyber-avatar'

type Props = {
  avatarAtual?: string | null
  temFoto: boolean
  onEscolher: (avatar: AvatarId) => Promise<void>
  onEnviarFoto: () => void
  onRemoverFoto: () => Promise<void>
  onFechar: () => void
  confirmLabel?: string
}

export function AvatarPicker({ avatarAtual, temFoto, onEscolher, onEnviarFoto, onRemoverFoto, onFechar, confirmLabel = 'Salvar avatar' }: Props) {
  const [selecionado, setSelecionado] = useState<string | null | undefined>(avatarAtual)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const escolhido = AVATARES.find((avatar) => avatar.id === selecionado)

  useEffect(() => {
    const fechar = (event: KeyboardEvent) => { if (event.key === 'Escape') onFechar() }
    document.addEventListener('keydown', fechar)
    return () => document.removeEventListener('keydown', fechar)
  }, [onFechar])

  async function salvar() {
    if (!escolhido) return
    setSalvando(true)
    setErro('')
    try {
      await onEscolher(escolhido.id)
      onFechar()
    } catch (causa) {
      setErro(causa instanceof Error ? causa.message : 'Não foi possível salvar o avatar.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="profile-settings-backdrop avatar-picker-backdrop" role="dialog" aria-modal="true" aria-labelledby="avatar-picker-title" onClick={(event) => { if (event.target === event.currentTarget) onFechar() }}>
      <article className="avatar-picker">
        <button className="profile-modal-close" type="button" onClick={onFechar} aria-label="Fechar"><X size={20} /></button>
        <header className="avatar-picker-head">
          <h2 id="avatar-picker-title">Escolha seu avatar</h2>
          <p>Cada avatar representa uma habilidade de quem protege o mundo digital.</p>
        </header>

        <div className="avatar-picker-grid" role="radiogroup" aria-label="Avatares disponíveis">
          {AVATARES.map((avatar) => {
            const ativo = selecionado === avatar.id
            return (
              <button key={avatar.id} type="button" role="radio" aria-checked={ativo} className={`avatar-option${ativo ? ' is-selected' : ''}`} onClick={() => setSelecionado(avatar.id)}>
                <span className="avatar-option-art"><CyberAvatar id={avatar.id} />{ativo && <i><Check size={13} strokeWidth={3} /></i>}</span>
                <strong>{avatar.nome}</strong>
              </button>
            )
          })}
        </div>

        <p className="avatar-picker-caption" aria-live="polite">{escolhido ? <><strong>{escolhido.nome}.</strong> {escolhido.descricao}</> : 'Selecione um avatar para ver a descrição.'}</p>
        {temFoto && escolhido && <p className="avatar-picker-note">Ao salvar, o avatar substitui a foto enviada.</p>}
        {erro && <p className="prova-erro" role="alert">{erro}</p>}

        <footer className="avatar-picker-actions">
          <div>
            <button className="avatar-picker-link" type="button" onClick={onEnviarFoto}><Camera size={15} /> {temFoto ? 'Trocar foto' : 'Enviar uma foto'}</button>
            {temFoto && <button className="avatar-picker-link is-danger" type="button" onClick={() => { void onRemoverFoto() }}>Remover foto</button>}
          </div>
          <div>
            <button className="dashboard-button-secondary" type="button" onClick={onFechar}>Cancelar</button>
            <button className="dashboard-button-primary" type="button" onClick={salvar} disabled={!escolhido || salvando}>{salvando ? 'Salvando...' : confirmLabel}</button>
          </div>
        </footer>
      </article>
    </div>
  )
}
