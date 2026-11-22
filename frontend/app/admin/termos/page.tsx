'use client'

import { FormEvent, useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import type { PublishedTermsData } from '@/components/published-terms'

import { TermsEditor } from '@/components/admin/terms-editor'
import { parseTermsSections } from '@/lib/terms-sections'
import './termos.css'

type AdminTerms = PublishedTermsData & { historico: { versao: string; publicadoEm: string }[] }

function LegalDocumentEditor({ kind }: { kind: 'terms' | 'privacy' }) {
  const privacy = kind === 'privacy'
  const endpoint = privacy ? '/admin/privacidade' : '/admin/termos'
  const title = privacy ? 'Privacidade e LGPD' : 'Termos de Uso'
  const prefix = privacy ? 'privacy' : 'terms'
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
    apiFetch(endpoint, { cache: 'no-store' }).then(async response => {
      if (!response.ok) throw new Error('Não foi possível carregar o documento. Verifique sua permissão e tente novamente.')
      return response.json().then(data => ({ ...data, termsVersion: data.termsVersion || data.version })) as Promise<AdminTerms>
    }).then(data => { if (active) { setCurrent(data); setContent(data.conteudo); setVersion('') } })
      .catch(cause => { if (active) setError(cause.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [attempt, endpoint])

  async function publish(event: FormEvent) {
    event.preventDefault()
    if (!current || saving) return
    setSaving(true); setError(''); setMessage('')
    try {
      const response = await apiFetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versao: version.trim(), conteudo: content.trim(), versaoAnterior: current.termsVersion }),
      })
      const raw = await response.json()
      const data = { ...raw, termsVersion: raw.termsVersion || raw.version }
      if (!response.ok) throw new Error(Array.isArray(data.message) ? data.message.join(' ') : data.message || 'Não foi possível publicar o documento.')
      setCurrent({ ...data, historico: [{ versao: data.termsVersion, publicadoEm: data.publicadoEm }, ...current.historico] })
      setContent(data.conteudo); setVersion(''); setMessage(`Versão ${data.termsVersion} publicada com sucesso.`)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível publicar os termos.') }
    finally { setSaving(false) }
  }

  if (loading) return <p role="status">Carregando o documento…</p>
  return <section className="mx-auto max-w-5xl space-y-6">
    <header><p className="text-sm font-semibold uppercase tracking-widest text-blue-600">Configurações</p><h2 className="mt-2 text-2xl font-bold">{title}</h2><p className="mt-2 text-slate-600">Edite o texto e informe uma nova versão para publicá-lo no site. As versões anteriores e os aceites já registrados ficam preservados.</p></header>
    {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{error} <button type="button" className="underline" onClick={() => setAttempt(value => value + 1)} disabled={saving}>Recarregar documento</button></div>}
    {message && <p role="status" className="rounded-lg bg-green-50 p-4 text-green-800">{message}</p>}
    {current && <>
      <p>Versão publicada: <strong>{current.termsVersion}</strong> · {new Date(current.publicadoEm).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
      <form onSubmit={publish} className="space-y-5 border border-slate-200 bg-white p-6">
        <div><label htmlFor={`${prefix}-version`} className="block font-semibold">Nova versão</label><input id={`${prefix}-version`} value={version} onChange={event => setVersion(event.target.value)} required maxLength={50} pattern={'[A-Za-z0-9][A-Za-z0-9._\\-]*'} placeholder="Ex.: 2026-12-01 ou 1.1" disabled={saving} className="mt-2 w-full max-w-md border border-slate-300 p-3" /><p className="mt-1 text-sm text-slate-600">Use uma versão inédita com letras, números, pontos, hífens ou sublinhados.</p></div>
        <p className="terms-layout-note"><strong>Layout original preservado.</strong> O site usa o índice lateral e os cards numerados, com as mesmas cores e disposição. Edite as seções abaixo para atualizar o conteúdo mantendo essa apresentação.</p>
        <TermsEditor content={content} onChange={setContent} disabled={saving} kind={kind} />
        <button type="submit" disabled={saving || !version.trim() || version.trim() === current.termsVersion || content.trim().length < 20 || content.length > 100000 || parseTermsSections(content, kind).some(section => !section.titulo.trim() || !section.conteudo.trim())} className="bg-blue-700 px-5 py-3 font-semibold text-white disabled:opacity-50">{saving ? 'Publicando…' : 'Publicar nova versão'}</button>
      </form>
      <section><h2 className="text-xl font-semibold">Versões publicadas</h2><ul className="mt-3 divide-y rounded-lg border bg-white">{current.historico.map(item => <li key={item.versao} className="flex flex-wrap justify-between gap-2 p-4"><strong>{item.versao}</strong><span>{new Date(item.publicadoEm).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</span></li>)}</ul></section>
    </>}
  </section>
}

export default function AdminTermosPage() {
  const [selected, setSelected] = useState<'terms' | 'privacy'>('terms')
  return <section className="mx-auto max-w-5xl space-y-6">
    <header><h1 className="text-3xl font-bold">Termos e Privacidade</h1><p className="mt-2 text-slate-600">Escolha o documento para editar suas seções. Cada documento possui versão e histórico próprios.</p></header>
    <div className="legal-document-tabs" role="tablist" aria-label="Documentos legais">
      <button type="button" role="tab" id="terms-tab" aria-controls="terms-panel" aria-selected={selected === 'terms'} onClick={() => setSelected('terms')}>Termos de Uso</button>
      <button type="button" role="tab" id="privacy-tab" aria-controls="privacy-panel" aria-selected={selected === 'privacy'} onClick={() => setSelected('privacy')}>Privacidade e LGPD</button>
    </div>
    <div role="tabpanel" id="terms-panel" aria-labelledby="terms-tab" hidden={selected !== 'terms'}><LegalDocumentEditor kind="terms" /></div>
    <div role="tabpanel" id="privacy-panel" aria-labelledby="privacy-tab" hidden={selected !== 'privacy'}><LegalDocumentEditor kind="privacy" /></div>
  </section>
}
