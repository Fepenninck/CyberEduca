'use client'

import { FormEvent, useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import type { PublishedTermsData } from '@/components/published-terms'

import { TermsEditor } from '@/components/admin/terms-editor'
import { parseTermsSections } from '@/lib/terms-sections'
import './termos.css'

type AdminTerms = PublishedTermsData & { historico: { versao: string; publicadoEm: string }[] }

export default function AdminTermosPage() {
  const [current, setCurrent] = useState<AdminTerms | null>(null)
  const [version, setVersion] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    setLoading(true); setError('')
    apiFetch('/admin/termos', { cache: 'no-store' }).then(async response => {
      if (!response.ok) throw new Error('Não foi possível carregar os termos. Verifique sua permissão e tente novamente.')
      return response.json() as Promise<AdminTerms>
    }).then(data => { if (active) { setCurrent(data); setContent(data.conteudo); setVersion('') } })
      .catch(cause => { if (active) setError(cause.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [attempt])

  async function publish(event: FormEvent) {
    event.preventDefault()
    if (!current || saving) return
    setSaving(true); setError(''); setMessage('')
    try {
      const response = await apiFetch('/admin/termos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versao: version.trim(), conteudo: content.trim(), versaoAnterior: current.termsVersion }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(Array.isArray(data.message) ? data.message.join(' ') : data.message || 'Não foi possível publicar os termos.')
      setCurrent({ ...data, historico: [{ versao: data.termsVersion, publicadoEm: data.publicadoEm }, ...current.historico] })
      setContent(data.conteudo); setVersion(''); setMessage(`Versão ${data.termsVersion} publicada com sucesso.`)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível publicar os termos.') }
    finally { setSaving(false) }
  }

  if (loading) return <p role="status">Carregando os Termos de Uso…</p>
  return <section className="mx-auto max-w-5xl space-y-6">
    <header><p className="text-sm font-semibold uppercase tracking-widest text-blue-600">Configurações</p><h1 className="mt-2 text-3xl font-bold">Termos de Uso</h1><p className="mt-2 text-slate-600">Edite o texto e informe uma nova versão para publicá-lo no site. As versões anteriores e os aceites já registrados ficam preservados.</p></header>
    {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{error} <button type="button" className="underline" onClick={() => setAttempt(value => value + 1)} disabled={saving}>Recarregar termos</button></div>}
    {message && <p role="status" className="rounded-lg bg-green-50 p-4 text-green-800">{message}</p>}
    {current && <>
      <p>Versão publicada: <strong>{current.termsVersion}</strong> · {new Date(current.publicadoEm).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
      <form onSubmit={publish} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
        <div><label htmlFor="terms-version" className="block font-semibold">Nova versão</label><input id="terms-version" value={version} onChange={event => setVersion(event.target.value)} required maxLength={50} pattern={'[A-Za-z0-9][A-Za-z0-9._\\-]*'} placeholder="Ex.: 2026-12-01 ou 1.1" disabled={saving} className="mt-2 w-full max-w-md rounded-lg border border-slate-300 p-3" /><p className="mt-1 text-sm text-slate-600">Use uma versão inédita com letras, números, pontos, hífens ou sublinhados.</p></div>
        <p className="terms-layout-note"><strong>Layout original preservado.</strong> O site usa o índice lateral e os cards numerados, com as mesmas cores e disposição. Edite as seções abaixo para atualizar o conteúdo mantendo essa apresentação.</p>
        <TermsEditor content={content} onChange={setContent} disabled={saving} />
        <button type="submit" disabled={saving || !version.trim() || version.trim() === current.termsVersion || content.trim().length < 20 || content.length > 100000 || parseTermsSections(content).some(section => !section.titulo.trim() || !section.conteudo.trim())} className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white disabled:opacity-50">{saving ? 'Publicando…' : 'Publicar nova versão'}</button>
      </form>
      <section><h2 className="text-xl font-semibold">Versões publicadas</h2><ul className="mt-3 divide-y rounded-lg border bg-white">{current.historico.map(item => <li key={item.versao} className="flex flex-wrap justify-between gap-2 p-4"><strong>{item.versao}</strong><span>{new Date(item.publicadoEm).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</span></li>)}</ul></section>
    </>}
  </section>
}
