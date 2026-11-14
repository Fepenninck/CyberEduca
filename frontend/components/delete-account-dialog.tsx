'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { apiFetch } from '@/lib/api'

export function DeleteAccountDialog({ userId, onClose }: { userId: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [confirmation, setConfirmation] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    const modal = dialog.current
    modal?.showModal()
    return () => modal?.close()
  }, [])
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (confirmation !== 'excluir' || deleting) return
    setDeleting(true); setError('')
    try {
      const response = await apiFetch('/usuarios/me', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirmacao: confirmation }),
      })
      if (!response.ok) {
        const result = await response.json().catch(() => ({}))
        throw new Error(response.status === 401 ? 'Sua sessão expirou. Entre novamente para excluir a conta.' : Array.isArray(result.message) ? result.message.join(' ') : result.message || 'Não foi possível excluir a conta. Tente novamente.')
      }
      try {
        for (let index = localStorage.length - 1; index >= 0; index--) {
          const key = localStorage.key(index)
          if (key?.startsWith(`cybereduca-achievement:${userId}:`)) localStorage.removeItem(key)
        }
      } catch { /* A indisponibilidade do armazenamento local não impede a exclusão. */ }
      window.location.replace('/login?conta=excluida')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível excluir a conta.'); setDeleting(false) }
  }
  return <dialog ref={dialog} className="delete-account-dialog" aria-labelledby="delete-account-title" aria-describedby="delete-account-description" onCancel={event => { event.preventDefault(); if (!deleting) onClose() }}>
    <form onSubmit={submit}>
      <h2 id="delete-account-title">Excluir sua conta?</h2>
      <p id="delete-account-description">Seu cadastro, foto, progresso, conquistas e histórico de quizzes, simulações, avaliações e consultas serão removidos. Essa ação não pode ser desfeita.</p>
      <label htmlFor="delete-account-confirmation">Digite <strong>excluir</strong> para confirmar.</label>
      <input id="delete-account-confirmation" autoFocus autoComplete="off" autoCapitalize="none" spellCheck={false} required disabled={deleting} value={confirmation} onChange={event => setConfirmation(event.target.value)} />
      {error && <p className="delete-account-error" role="alert">{error}</p>}
      <div className="delete-account-actions"><button type="button" disabled={deleting} onClick={onClose}>Cancelar</button><button type="submit" disabled={deleting || confirmation !== 'excluir'}>{deleting ? 'Excluindo…' : 'Excluir minha conta'}</button></div>
    </form>
  </dialog>
}
