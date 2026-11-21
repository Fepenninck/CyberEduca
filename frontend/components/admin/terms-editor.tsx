'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { parseTermsSections, serializeTermsSections, type TermsSection } from '@/lib/terms-sections'

export function TermsEditor({ content, onChange, disabled }: { content: string; onChange: (value: string) => void; disabled: boolean }) {
  const [removed, setRemoved] = useState<{ section: TermsSection; index: number } | null>(null)
  const [expanded, setExpanded] = useState<number[]>([0])
  const [sections, setSections] = useState(() => parseTermsSections(content))
  const emitted = useRef(content)
  useEffect(() => {
    if (content !== emitted.current) {
      emitted.current = content
      setSections(parseTermsSections(content))
    }
  }, [content])
  const commit = (next: TermsSection[]) => {
    setSections(next)
    emitted.current = serializeTermsSections(next)
    onChange(emitted.current)
  }
  const update = (index: number, field: 'titulo' | 'conteudo', value: string) => {
    commit(sections.map((section, current) => current === index ? { ...section, [field]: value } : section))
  }
  const move = (index: number, direction: number) => {
    const next = [...sections]
    ;[next[index], next[index + direction]] = [next[index + direction], next[index]]
    commit(next)
  }
  return <div className="terms-editor">
    <div className="terms-editor-heading"><div><h2>Conteúdo dos termos</h2><p>Cada seção mantém seu card numerado e seu lugar no índice da página.</p></div><span>{sections.length} seções</span></div>
      <div className="terms-editor-sections">{sections.map((section, index) => <details className="terms-editor-section" key={index} open={expanded.includes(index)} onToggle={event => { const open = event.currentTarget.open; setExpanded(previous => open ? previous.includes(index) ? previous : [...previous, index] : previous.filter(item => item !== index)) }}>
        <summary><span>{String(index + 1).padStart(2, '0')}</span>{section.titulo || 'Seção sem título'}</summary>
        <div className="terms-editor-fields">
          <div><label htmlFor={`terms-section-title-${index}`}>Título da seção {index + 1}</label><input id={`terms-section-title-${index}`} value={section.titulo} onChange={event => update(index, 'titulo', event.target.value)} required maxLength={160} disabled={disabled} /></div>
          <div><label htmlFor={`terms-section-content-${index}`}>Texto da seção {index + 1}</label><textarea id={`terms-section-content-${index}`} value={section.conteudo} onChange={event => update(index, 'conteudo', event.target.value)} rows={7} required disabled={disabled} /></div>
          <p className="terms-editor-help">Separe parágrafos com uma linha em branco. Use - para listas e **texto** para negrito.</p>
          <div className="terms-editor-actions">
            <button type="button" aria-label={`Subir seção ${index + 1}`} onClick={() => move(index, -1)} disabled={disabled || index === 0}><ArrowUp size={16} />Subir</button>
            <button type="button" aria-label={`Descer seção ${index + 1}`} onClick={() => move(index, 1)} disabled={disabled || index === sections.length - 1}><ArrowDown size={16} />Descer</button>
            <button type="button" aria-label={`Remover seção ${index + 1}`} onClick={() => { setRemoved({ section, index }); commit(sections.filter((_, current) => current !== index)) }} disabled={disabled || sections.length === 1}><Trash2 size={16} />Remover seção</button>
          </div>
        </div>
      </details>)}</div>
      <button type="button" className="terms-editor-add" onClick={() => { setExpanded(previous => [...previous, sections.length]); commit([...sections, { id: '', titulo: 'Nova seção', conteudo: '' }]) }} disabled={disabled}><Plus size={18} />Adicionar seção</button>
      {removed && <p role="status" className="terms-editor-help">Seção removida desta edição. <button type="button" disabled={disabled} onClick={() => { const next = [...sections]; next.splice(Math.min(removed.index, next.length), 0, removed.section); commit(next); setRemoved(null) }}>Desfazer remoção</button></p>}
    <p className="terms-editor-help">{content.length.toLocaleString('pt-BR')} de 100.000 caracteres. As alterações só aparecem no site ao publicar uma nova versão.</p>
  </div>
}
