'use client'

import Link from 'next/link'
import { BookOpen, Check, ChevronLeft, ClipboardCheck, Clock3, Home, LockKeyhole, MonitorPlay, Save, ShieldCheck, UserRound, X } from 'lucide-react'
import { ChangeEvent, PointerEvent, useEffect, useMemo, useRef, useState } from 'react'
import { API_URL, TrackSummary } from '@/lib/api'
import { DashboardNavigation } from '@/components/dashboard-navigation'
import { getStoredProfile } from '@/components/user-menu'

type Profile = { nome: string; email: string; foto?: string }

export default function PerfilPage() {
  const [profile, setProfile] = useState<Profile>({ nome: '', email: '' })
  const [tracks, setTracks] = useState<TrackSummary[]>([])
  const [cropSource, setCropSource] = useState('')
  const [zoom, setZoom] = useState(1)
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 })
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'settings'>('overview')
  const fileInput = useRef<HTMLInputElement>(null)
  const cropDrag = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 })

  useEffect(() => {
    setProfile(getStoredProfile())
    fetch(`${API_URL}/trilhas`).then((response) => response.ok ? response.json() : []).then(setTracks).catch(() => setTracks([]))
  }, [])

  const stats = useMemo(() => {
    const completed = tracks.reduce((total, track) => total + Math.round(track.totalAulas * track.percentual / 100), 0)
    const total = tracks.reduce((sum, track) => sum + track.totalAulas, 0)
    const overall = tracks.length ? Math.round(tracks.reduce((sum, track) => sum + track.percentual, 0) / tracks.length) : 0
    const basic = tracks.find((track) => track.nivel === 'BASICO')?.percentual ?? 0
    return { completed, total, overall, basic, rate: total ? Math.round(completed / total * 100) : 0 }
  }, [tracks])

  function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => { setCropSource(String(reader.result)); setZoom(1); setCropOffset({ x: 0, y: 0 }) }
    reader.readAsDataURL(file)
  }

  function applyCrop() {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = 320
      const scale = Math.max(canvas.width / image.width, canvas.height / image.height) * zoom
      const width = image.width * scale
      const height = image.height * scale
      const x = (canvas.width - width) / 2 + canvas.width * cropOffset.x / 100
      const y = (canvas.height - height) / 2 + canvas.height * cropOffset.y / 100
      canvas.getContext('2d')?.drawImage(image, x, y, width, height)
      setProfile((current) => {
        const updatedProfile = { ...current, foto: canvas.toDataURL('image/jpeg', .9) }
        localStorage.setItem('cybereduca-profile', JSON.stringify(updatedProfile))
        return updatedProfile
      })
      setCropSource('')
    }
    image.src = cropSource
  }

  function startCropDrag(event: PointerEvent<HTMLDivElement>) {
    event.preventDefault()
    cropDrag.current = { x: event.clientX, y: event.clientY, offsetX: cropOffset.x, offsetY: cropOffset.y }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function moveCropDrag(event: PointerEvent<HTMLDivElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    const bounds = event.currentTarget.getBoundingClientRect()
    setCropOffset({
      x: Math.max(-25, Math.min(25, cropDrag.current.offsetX + (event.clientX - cropDrag.current.x) / bounds.width * 100)),
      y: Math.max(-25, Math.min(25, cropDrag.current.offsetY + (event.clientY - cropDrag.current.y) / bounds.height * 100)),
    })
  }

  function saveProfile() {
    localStorage.setItem('cybereduca-profile', JSON.stringify(profile))
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2400)
  }

  const basicStatus = stats.basic >= 80 ? 'Você domina os fundamentos.' : stats.basic >= 40 ? 'Você está evoluindo no nível básico.' : 'Comece pelos fundamentos.'

  return <main className="app-shell dashboard-page profile-page">
    <DashboardNavigation active="perfil" />
    <section className="profile-wrap">
      <Link className="profile-back" href="/dashboard"><ChevronLeft size={16} /> Voltar ao dashboard</Link>
      <header className="profile-hero">
        <div className="profile-avatar">
          {profile.foto ? <img src={profile.foto} alt="Foto de perfil" /> : <UserRound size={44} />}
        </div>
        <div className="profile-identity"><span className="profile-kicker">Perfil do aluno</span><div><h1>{profile.nome || 'Seu perfil'}</h1>{profile.nome && <span className="profile-handle">@{profile.nome.toLowerCase().replace(/\s+/g, '')}</span>}</div><p>{profile.email || 'Dados da conta indisponíveis'}</p></div>
      </header>

      <div className="profile-tabs"><button className={activeTab === 'overview' ? 'is-active' : ''} type="button" onClick={() => setActiveTab('overview')}>Visão geral</button><button type="button" onClick={() => window.dispatchEvent(new Event('open-account-settings'))}>Configurações</button></div>
      <section className="profile-overview">
        <div className="profile-main">
          <article className="profile-card profile-level-card"><span className="profile-card-label"><ShieldCheck size={17} /> Seu nível</span><div className="profile-level-content"><div className="profile-level-number">{stats.overall}<small>%</small></div><div><strong>{basicStatus}</strong><p>Seu progresso geral é calculado pelas trilhas de aprendizagem disponíveis.</p><div className="profile-progress"><span style={{ width: `${stats.overall}%` }} /></div></div></div></article>
          <article className="profile-card"><h2>Progresso nas trilhas</h2><div className="profile-track-list">{tracks.length ? tracks.map((track) => <div key={track.id}><div><span>{track.nivel.charAt(0) + track.nivel.slice(1).toLowerCase()}</span><strong>{track.percentual}%</strong></div><div className="profile-progress"><span style={{ width: `${track.percentual}%` }} /></div></div>) : <p>Carregando seu progresso...</p>}</div></article>
          <article className="profile-card"><h2>Ritmo de estudo</h2><div className="profile-study-metrics"><div><BookOpen size={19} /><strong>{stats.completed}</strong><span>Aulas concluídas</span></div><div><Check size={19} /><strong>{stats.rate}%</strong><span>Taxa de conclusão</span></div><div><Clock3 size={19} /><strong>{stats.total}</strong><span>Aulas disponíveis</span></div></div><p className="profile-note">A frequência semanal aparecerá quando o histórico de atividades estiver disponível.</p></article>
        </div>
        <aside className="profile-side"><article className="profile-card"><span className="profile-card-label"><ShieldCheck size={17} /> Resumo</span><strong>{stats.basic >= 80 ? 'Nível básico concluído' : 'Nível básico em andamento'}</strong><p>{stats.completed} aulas concluídas e {stats.overall}% de progresso geral.</p></article><article className="profile-card"><h2>Atividade semanal</h2><p>O histórico semanal será exibido quando a API registrar as datas de estudo.</p></article></aside>
      </section>
      {activeTab === 'settings' && (
        <div className="profile-settings-backdrop" role="dialog" aria-modal="true" aria-labelledby="profile-settings-title">
          <article className="profile-card profile-settings profile-settings-modal">
            <button className="profile-modal-close" type="button" onClick={() => setActiveTab('overview')} aria-label="Fechar configurações"><X size={20} /></button>
            <div className="profile-settings-heading"><div><h2 id="profile-settings-title">Configurações da conta</h2><p>Atualize suas informações sem sair da página atual.</p></div></div>
            <div className="profile-form-grid"><label>Nome completo<input value={profile.nome} onChange={(event) => setProfile({ ...profile, nome: event.target.value })} autoComplete="name" /></label><label>E-mail<input type="email" value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} autoComplete="email" /></label><label>Nova senha<input type="password" placeholder="Deixe em branco para não alterar" autoComplete="new-password" /></label><label>Confirmar nova senha<input type="password" placeholder="Repita a nova senha" autoComplete="new-password" /></label></div>
            <div className="profile-privacy"><LockKeyhole size={18} /><div><strong>Privacidade e proteção de dados</strong><p>Nome e e-mail são usados para identificar e dar acesso à sua conta.</p></div></div>
            <div className="profile-modal-actions"><button type="button" onClick={() => setActiveTab('overview')}>Cancelar</button><button type="button" onClick={saveProfile}>{saved ? 'Salvo' : 'Salvar'}</button></div>
          </article>
        </div>
      )}
      <input ref={fileInput} className="profile-file-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={choosePhoto} />
    </section>
    {cropSource && <div className="crop-backdrop" role="dialog" aria-modal="true" aria-labelledby="crop-title"><div className="crop-modal"><h2 id="crop-title">Ajustar foto de perfil</h2><p className="crop-help">Arraste a imagem para posicioná-la. Use o zoom para aproximar.</p><div className="crop-preview" onPointerDown={startCropDrag} onPointerMove={moveCropDrag}><img draggable={false} src={cropSource} alt="Prévia para recorte" style={{ transform: `translate(${cropOffset.x}%, ${cropOffset.y}%) scale(${zoom})` }} /></div><label>Zoom<input type="range" min="1" max="2.5" step=".05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /></label><div className="crop-actions"><button className="dashboard-button-secondary" type="button" onClick={() => setCropSource('')}>Cancelar</button><button className="dashboard-button-primary" type="button" onClick={applyCrop}>Usar foto</button></div></div></div>}
  </main>
}
