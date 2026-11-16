'use client'

import { LoadingScreen } from '@/components/ui/loading-screen'
import Link from 'next/link'
import { ChevronLeft, Pencil } from 'lucide-react'
import { ChangeEvent, PointerEvent, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, getDesempenho, type Desempenho, updateCurrentUser } from '@/lib/api'
import { DashboardNavigation } from '@/components/dashboard-navigation'
import type { CSSProperties } from 'react'
import { AvatarPicker } from '@/components/avatar-picker'
import { LEVEL_BADGES, LevelAchievements, useAchievements } from '@/components/level-achievements'
import './perfil.css'
import { AVATARES, ProfilePicture, type AvatarId } from '@/components/cyber-avatar'
import { DashboardInsights } from '@/components/dashboard-insights'
import { progressoDoNivel } from '@/lib/learning-progress'

type Profile = { nome: string; email: string; foto?: string | null; avatar?: string | null }

export default function PerfilPage() {
  const achievements = useAchievements()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile>({ nome: '', email: '' })
  const [desempenho, setDesempenho] = useState<Desempenho | null>(null)
  const [performanceError, setPerformanceError] = useState(false)
  const [cropSource, setCropSource] = useState('')
  const [zoom, setZoom] = useState(1)
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 })
  const [pickerOpen, setPickerOpen] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const cropDrag = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 })

  useEffect(() => {
    getCurrentUser()
      .then((user) => setProfile({ nome: user.nome, email: user.email, foto: user.foto, avatar: user.avatar }))
      .catch(() => router.replace('/login'))
  }, [router])

  useEffect(() => {
    let active = true
    let request = 0
    const load = async () => {
      const current = ++request
      try {
        const data = await getDesempenho()
        if (active && current === request) { setDesempenho(data); setPerformanceError(false) }
      } catch {
        if (active && current === request) setPerformanceError(true)
      }
    }
    const events = ['focus', 'learning-progress-updated', 'simulation-progress-updated', 'quiz-progress-updated']
    void load()
    events.forEach(event => window.addEventListener(event, load))
    return () => { active = false; events.forEach(event => window.removeEventListener(event, load)) }
  }, [])

  function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => { setCropSource(String(reader.result)); setZoom(1); setCropOffset({ x: 0, y: 0 }) }
    reader.readAsDataURL(file)
  }

  function applyCrop() {
    const image = new Image()
    image.onload = async () => {
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = 320
      const scale = Math.max(canvas.width / image.width, canvas.height / image.height) * zoom
      const width = image.width * scale
      const height = image.height * scale
      const x = (canvas.width - width) / 2 + canvas.width * cropOffset.x / 100
      const y = (canvas.height - height) / 2 + canvas.height * cropOffset.y / 100
      canvas.getContext('2d')?.drawImage(image, x, y, width, height)
      const updatedProfile = { ...profile, foto: canvas.toDataURL('image/jpeg', .82) }
      setProfile(updatedProfile)
      await updateCurrentUser(updatedProfile)
      window.dispatchEvent(new Event('profile-updated'))
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

  async function chooseAvatar(avatar: AvatarId) {
    const updated = await updateCurrentUser({ avatar, foto: null })
    setProfile((current) => ({ ...current, foto: updated.foto, avatar: updated.avatar }))
    window.dispatchEvent(new Event('profile-updated'))
  }

  async function removePhoto() {
    const updated = await updateCurrentUser({ foto: null })
    setProfile((current) => ({ ...current, foto: updated.foto }))
    window.dispatchEvent(new Event('profile-updated'))
  }

  const levelColors: Record<string, string> = { BASICO: '#24b4ff', INTERMEDIARIO: '#ffd34e', AVANCADO: '#ff4654' }
  const currentAvatar = AVATARES.find((avatar) => avatar.id === profile.avatar)

  const certifiedLevel = [...LEVEL_BADGES].reverse().find(badge => achievements.data.some(item => item.nivel === badge.level && item.conquistada))
  const nextLevel = LEVEL_BADGES.find(badge => !achievements.data.some(item => item.nivel === badge.level && item.conquistada))
  const nextProgress = achievements.data.find(item => item.nivel === nextLevel?.level)
  const nextLessonsComplete = Boolean(nextProgress && nextProgress.totalAulas > 0 && nextProgress.aulasConcluidas === nextProgress.totalAulas)

  return <main className="app-shell dashboard-page profile-page">
    <DashboardNavigation active="perfil" />
    <section className="profile-wrap">
      <Link className="profile-back" href="/dashboard"><ChevronLeft size={16} /> Voltar ao dashboard</Link>
      <header className="profile-hero" style={{ '--avatar-color': currentAvatar?.cor ?? '#b2ff00' } as CSSProperties}>
        <button className="profile-avatar" type="button" onClick={() => setPickerOpen(true)} aria-label="Alterar avatar ou foto de perfil">
          <ProfilePicture foto={profile.foto} avatar={profile.avatar} iconSize={44} alt={currentAvatar ? `Avatar ${currentAvatar.nome}` : 'Foto de perfil'} />
          <span aria-hidden="true"><Pencil size={13} /></span>
        </button>
        <div className="profile-identity"><span className="profile-kicker">Perfil do aluno</span><div><h1>{profile.nome || 'Seu perfil'}</h1>{profile.nome && <span className="profile-handle">@{profile.nome.toLowerCase().replace(/\s+/g, '')}</span>}</div><p>{profile.email || 'Dados da conta indisponíveis'}</p></div>
      </header>

      <div className="profile-tabs"><button className="is-active" type="button" aria-current="page">Visão geral</button><Link href="/configuracoes">Configurações</Link></div>
      <section className="profile-overview">
        <div className="profile-main">
          <article className="profile-card profile-level-card">
            <h2>Seu nível</h2>
            {achievements.error ? <p role="status">Não foi possível carregar seu nível.</p> : !achievements.data.length ? <LoadingScreen label="Carregando seu nível..." /> : <div className="profile-certification">
              <strong className="profile-certification-title">{certifiedLevel?.title ?? 'Iniciante'}</strong>
              <p>{certifiedLevel ? 'Nível certificado por aprovação na avaliação.' : 'Você ainda não possui uma certificação por prova.'}</p>
              <p>{nextLevel ? `${nextLevel.title}: ${nextLessonsComplete ? 'aulas concluídas; falta passar na prova com nota mínima 6.' : 'conclua as aulas e passe na prova com nota mínima 6.'}` : 'Você conquistou as certificações dos três níveis.'}</p>
            </div>}
          </article>
          <article className="profile-card"><h2>Progresso por nível</h2><div className="profile-track-list">{achievements.error ? <p>Não foi possível carregar seu progresso.</p> : achievements.data.length ? achievements.data.map(level => {
            const percentage = progressoDoNivel(level)
            const name = level.nivel === 'BASICO' ? 'Básico' : level.nivel === 'INTERMEDIARIO' ? 'Intermediário' : 'Avançado'
            return <div key={level.nivel}><div><span>{name}</span><strong>{percentage}%</strong></div><div className="profile-progress" role="progressbar" aria-label={`${name}: aulas e aprovação na prova`} aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${percentage}%`, background: levelColors[level.nivel] }} /></div></div>
          }) : <LoadingScreen label={"Carregando seu progresso..."} />}</div></article>
          {performanceError && <p role="status">Não foi possível atualizar seu desempenho. Volte a esta janela para tentar novamente.</p>}
          {!desempenho && !performanceError && <p role="status">Carregando seu desempenho...</p>}
          <DashboardInsights desempenho={desempenho} niveis={achievements.data} />
        </div>
        <aside className="profile-side"><LevelAchievements data={achievements.data} error={achievements.error} /></aside>
      </section>
      {pickerOpen && <AvatarPicker avatarAtual={profile.avatar} temFoto={Boolean(profile.foto)} onEscolher={chooseAvatar} onRemoverFoto={removePhoto} onEnviarFoto={() => { setPickerOpen(false); fileInput.current?.click() }} onFechar={() => setPickerOpen(false)} />}
      <input ref={fileInput} className="profile-file-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={choosePhoto} />
    </section>
    {cropSource && <div className="crop-backdrop" role="dialog" aria-modal="true" aria-labelledby="crop-title"><div className="crop-modal"><h2 id="crop-title">Ajustar foto de perfil</h2><p className="crop-help">Arraste a imagem para posicioná-la. Use o zoom para aproximar.</p><div className="crop-preview" onPointerDown={startCropDrag} onPointerMove={moveCropDrag}><img draggable={false} src={cropSource} alt="Prévia para recorte" style={{ transform: `translate(${cropOffset.x}%, ${cropOffset.y}%) scale(${zoom})` }} /></div><label>Zoom<input type="range" min="1" max="2.5" step=".05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /></label><div className="crop-actions"><button className="dashboard-button-secondary" type="button" onClick={() => setCropSource('')}>Cancelar</button><button className="dashboard-button-primary" type="button" onClick={applyCrop}>Usar foto</button></div></div></div>}
  </main>
}
