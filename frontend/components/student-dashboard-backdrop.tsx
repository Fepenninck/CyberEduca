import { BookOpen, Home, ListChecks, MonitorPlay, ShieldCheck, UserRound } from 'lucide-react'

// The welcome screen previews the layout without loading authenticated student data.
export function StudentDashboardBackdrop() {
  return <div className="terms-dashboard-backdrop" aria-hidden="true" inert>
    <div className="app-shell dashboard-page student-home">
      <header className="dashboard-header"><div className="dashboard-header-inner">
        <div className="dashboard-brand"><img src="/cybereduca-logo.png" alt="" /></div>
        <div className="terms-backdrop-nav"><span className="is-active"><Home size={18} />Início</span><span><BookOpen size={18} />Trilhas</span><span><MonitorPlay size={18} />Simulações</span><span><ListChecks size={18} />Quizzes</span><span><ShieldCheck size={18} />Laboratório</span></div>
        <div className="terms-backdrop-avatar"><UserRound size={22} /></div>
      </div></header>
      <div className="dashboard-wrap">
        <header className="dashboard-welcome dashboard-welcome-avatar"><div className="dashboard-welcome-picture"><UserRound size={30} /></div><div><h1>Olá!</h1><p>Que bom ter você por aqui. Vamos ao próximo passo?</p></div></header>
        <div className="student-start-grid">
          <section className="dash-hero terms-backdrop-hero">
            <div className="dash-hero-copy"><div className="dash-hero-tags"><span className="dash-hero-status">Sua jornada começa aqui</span><span className="dash-hero-level">Nível básico</span></div><h2>Comece sua jornada em cibersegurança</h2><p className="dash-hero-lesson">Aprenda a se proteger no mundo digital.</p><div className="dash-hero-actions"><span className="dashboard-button-primary">Explorar trilhas</span><span className="dash-hero-link">Ver todas as aulas</span></div></div>
            <div className="student-hero-art"><img src="/trilha-personagem-basico.png" alt="" /></div>
            <div className="student-track-progress"><div><span>Seu próximo passo está aqui</span><strong>Vamos começar</strong></div><div className="student-progress-bar"><span /></div></div>
          </section>
          <article className="dash-panel dash-stats"><h2>Sua jornada até aqui</h2><div className="dash-stat-row"><div><strong>—</strong><span>Progresso geral</span></div><div><strong>—</strong><span>Aulas concluídas</span></div><div><strong>—</strong><span>Trilhas iniciadas</span></div></div><div className="dash-levels">{['Básico', 'Intermediário', 'Avançado'].map(level => <div key={level} className="dash-level"><div><span>{level}</span><strong>—</strong></div><div className="dash-level-bar"><span /></div></div>)}</div></article>
        </div>
        <section className="dash-grid">{['Aulas da trilha', 'Pratique o que aprendeu', 'Suas conquistas'].map(title => <article className="dash-panel" key={title}><h2>{title}</h2><div className="terms-backdrop-lines"><span /><span /><span /></div></article>)}</section>
      </div>
    </div>
  </div>
}
