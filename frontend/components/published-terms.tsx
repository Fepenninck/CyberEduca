'use client'

import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { apiFetch } from '@/lib/api'
import { parseTermsSections, type TermsSection } from '@/lib/terms-sections'
import '@/app/politicas/politicas.css'

export type PublishedTermsData = { termsVersion: string; conteudo: string; publicadoEm: string }

export const TERMS_PAGE_TITLE = 'Condições claras para uma experiência de aprendizagem segura'
export const TERMS_PAGE_DESCRIPTION = 'Estas regras explicam como utilizar o CyberEduca+ de forma responsável, segura e compatível com sua finalidade educacional.'

export function TermsLastUpdated({ terms }: { terms: PublishedTermsData | null }) {
  if (!terms) return null
  return <footer className="legal-footer"><span>Última atualização: <time dateTime={terms.publicadoEm}>{new Date(terms.publicadoEm).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' })}</time></span></footer>
}

export function TermsIndex({ sections }: { sections: TermsSection[] }) {
  return <>{sections.map((section, index) => <a href={`#${section.id}`} key={section.id}><span>{String(index + 1).padStart(2, '0')}</span>{section.titulo}</a>)}</>
}

export function TermsDocument({ terms, compact = false, kind = 'terms' }: { terms: PublishedTermsData; compact?: boolean; kind?: 'terms' | 'privacy' }) {
  if (compact) return <div>
    <div className="space-y-4 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-6 [&_a]:underline">
      <ReactMarkdown skipHtml>{terms.conteudo}</ReactMarkdown>
    </div>
  </div>
  const sections = parseTermsSections(terms.conteudo, kind)
  return <>
    <div className="legal-cards">{sections.map((section, index) => <article className="legal-card" id={section.id} key={section.id}>
      <h2><span>{String(index + 1).padStart(2, '0')}</span>{section.titulo}</h2>
      <div className="legal-copy"><ReactMarkdown skipHtml>{section.conteudo}</ReactMarkdown></div>
    </article>)}</div>
  </>
}

export function TermsPagePreview({ terms }: { terms: PublishedTermsData }) {
  return <div className="legal-page legal-terms-preview" aria-label="Prévia do layout publicado">
    <aside className="legal-index"><nav aria-label="Índice da prévia dos termos"><h2>Termos de Uso</h2><TermsIndex sections={parseTermsSections(terms.conteudo)} /></nav></aside>
    <div className="legal-content"><section className="legal-section" id="termos-de-uso"><span className="legal-eyebrow">Termos de Uso</span><h1>{TERMS_PAGE_TITLE}</h1><p className="legal-lead">{TERMS_PAGE_DESCRIPTION}</p><TermsDocument terms={terms} /></section><TermsLastUpdated terms={terms} /></div>
  </div>
}

function usePublishedDocument(endpoint: string) {
  const [terms, setTerms] = useState<PublishedTermsData | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    setError(false)
    apiFetch(endpoint, { cache: 'no-store' }).then(async response => {
      if (!response.ok) throw new Error()
      return response.json()
    }).then(data => { if (active) setTerms({ ...data, termsVersion: data.termsVersion || data.version }) }).catch(() => { if (active) setError(true) })
    return () => { active = false }
  }, [attempt, endpoint])
  return { terms, error, retry: () => setAttempt(value => value + 1) }
}

export function usePublishedTerms() { return usePublishedDocument('/auth/termos') }
export function usePublishedPrivacy() { return usePublishedDocument('/politicas/privacidade') }
