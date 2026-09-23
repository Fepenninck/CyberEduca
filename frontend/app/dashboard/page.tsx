import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Home,
  Menu,
  MonitorPlay,
  Route,
  TrendingUp,
  UserRound,
} from 'lucide-react'

const dashboardData = {
  userName: 'Felipe',
  currentTrack: 'Fundamentos de Cibersegurança',
  currentLesson: 'Introdução à Segurança Digital',
  lastLesson: 'Segurança de Senhas',
  currentProgress: 65,
  startedTracks: 2,
  completedLessons: 8,
  overallProgress: 42,
  tracks: [
    { name: 'Básico', progress: 65, color: '#24b4ff', status: '65% concluído' },
    { name: 'Intermediário', progress: 20, color: '#ffd34e', status: '20% concluído' },
    { name: 'Avançado', progress: 0, color: '#ff4654', status: 'Não iniciado' },
  ],
}

export default function DashboardPage() {
  const data = dashboardData

  return (
    <main className="app-shell dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-header-inner">
          <Link href="/dashboard" className="dashboard-brand" aria-label="CyberEduca+ dashboard">
            <img src="/cybereduca-logo.png" alt="CyberEduca+" />
          </Link>
          <nav className="dashboard-nav" aria-label="Navegação da área do aluno">
            <Link className="is-active" href="/dashboard"><Home size={16} /> Início</Link>
            <Link href="/trilhas"><Route size={16} /> Trilhas</Link>
            <Link href="/aulas/o-que-e-cybersecurity"><BookOpen size={16} /> Minhas aulas</Link>
            <Link href="/em-breve"><MonitorPlay size={16} /> Simulações</Link>
            <Link href="/progresso"><TrendingUp size={16} /> Meu progresso</Link>
          </nav>
          <div className="dashboard-header-actions">
            <div className="dashboard-user" aria-label="Perfil do usuário">
              <span><UserRound size={18} /></span>
            </div>
          </div>
          <details className="dashboard-mobile-menu">
            <summary aria-label="Abrir navegação"><Menu size={24} /></summary>
            <nav>
              <Link href="/dashboard">Início</Link><Link href="/trilhas">Trilhas</Link>
              <Link href="/aulas/o-que-e-cybersecurity">Minhas aulas</Link><Link href="/em-breve">Simulações</Link>
              <Link href="/progresso">Meu progresso</Link><span><UserRound size={17} /> {data.userName}</span>
            </nav>
          </details>
        </div>
      </header>

      <div className="dashboard-wrap">
        <header className="dashboard-welcome">
          <h1>Olá, {data.userName}!</h1>
          <p>Continue desenvolvendo seus conhecimentos em cibersegurança.</p>
        </header>

        <section className="dashboard-main-grid" aria-label="Resumo da aprendizagem">
          <article className="continue-card">
            <div className="learning-card-top">
              <span className="learning-track-art" aria-hidden="true"><Route size={30} /></span>
              <div className="learning-track-copy">
                <div className="learning-badges"><span>Em andamento</span><small><BookOpen size={12} /> Trilha básica</small></div>
                <h2>{data.currentTrack}</h2>
                <p>{data.currentLesson}</p>
              </div>
              <div className="learning-top-progress">
                <div className="dashboard-progress-label"><span>Progresso</span><strong>{data.currentProgress}%</strong></div>
                <div className="dashboard-progress-bar" aria-label={`${data.currentProgress}% concluído`}><span style={{ width: `${data.currentProgress}%` }} /></div>
              </div>
            </div>

            <div className="learning-module">
              <div className="learning-module-head"><strong>Introdução</strong><span><CheckCircle2 size={17} /> Concluído</span></div>
              <div className="learning-module-lesson">
                <span className="lesson-status"><CheckCircle2 size={18} /></span>
                <span className="lesson-type">Teoria</span>
                <strong>{data.lastLesson}</strong>
              </div>
            </div>

            <div className="learning-card-footer">
              <div className="continue-actions">
                <Link className="dashboard-button-secondary module-link" href="/trilhas">Ver módulo completo</Link>
                <Link className="dashboard-button-primary" href="/aulas/o-que-e-cybersecurity">Continuar aprendendo</Link>
              </div>
            </div>
          </article>

          <aside className="summary-card">
            <div className="dashboard-card-heading compact">
              <div><span className="dashboard-section-label"><TrendingUp size={16} /> Sua jornada</span><h2>Seu progresso</h2></div>
            </div>
            <div className="summary-metrics">
              <div><span>Trilhas iniciadas</span><strong>{data.startedTracks}</strong></div>
              <div><span>Aulas concluídas</span><strong>{data.completedLessons}</strong></div>
            </div>
            <div className="overall-progress">
              <div className="dashboard-progress-label"><span>Progresso geral</span><strong>{data.overallProgress}%</strong></div>
              <div className="dashboard-progress-bar"><span style={{ width: `${data.overallProgress}%` }} /></div>
              <p>Você está construindo uma base cada vez mais segura.</p>
            </div>
            <Link className="dashboard-text-link" href="/progresso">Ver meu progresso <ArrowRight size={15} /></Link>
          </aside>
        </section>

        <section className="dashboard-tracks" aria-labelledby="dashboard-tracks-title">
          <div className="dashboard-section-heading">
            <div><span className="dashboard-eyebrow">Sua jornada</span><h2 id="dashboard-tracks-title">Suas trilhas</h2></div>
            <Link href="/trilhas">Explorar todas <ArrowRight size={15} /></Link>
          </div>
          <div className="dashboard-track-grid">
            {data.tracks.map((track, index) => (
              <Link className="dashboard-track-card" href="/trilhas" key={track.name} style={{ '--level-color': track.color } as React.CSSProperties}>
                <div className="track-card-header"><span className="level-dot" /><span>Trilha {String(index + 1).padStart(2, '0')}</span><ChevronRight size={18} /></div>
                <h3>{track.name}</h3>
                <div className="dashboard-progress-label"><span>{track.status}</span><strong>{track.progress}%</strong></div>
                <div className="dashboard-progress-bar"><span style={{ width: `${track.progress}%` }} /></div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
