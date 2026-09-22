'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import './login.css'

type Errors = { email?: string; password?: string }

const VisibilityIcon = () => <svg className="visibility-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5Zm0 12.5a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" /></svg>
const VisibilityOffIcon = () => <svg className="visibility-off-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5Zm0 12.5a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" /><path className="visibility-off-cut" d="M4 4 20 20" /><path className="visibility-off-slash" d="M4 4 20 20" /></svg>

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const formIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && password.length >= 6

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors: Errors = {}
    if (!email.trim()) nextErrors.email = 'Informe seu e-mail.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = 'Digite um e-mail válido.'
    if (!password) nextErrors.password = 'Informe sua senha.'
    else if (password.length < 6) nextErrors.password = 'A senha deve ter pelo menos 6 caracteres.'
    setErrors(nextErrors)
  }

  return <main className="login-page">
    <div className="login-shell">
      <Link href="/" className="login-brand" aria-label="Voltar para o início do CyberEduca+"><img src="/cybereduca-logo.png" alt="CyberEduca+" /></Link>
      <section className="login-card" aria-labelledby="login-title">
        <h1 id="login-title">Entre no CyberEduca+</h1>
        <form onSubmit={submit} noValidate>
          <div className="login-field"><label htmlFor="email">E-mail</label><div className={`login-input${errors.email ? ' is-invalid' : ''}`}><input id="email" name="email" type="email" autoComplete="email" value={email} onChange={(event) => { setEmail(event.target.value); setErrors((current) => ({ ...current, email: undefined })) }} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} />{errors.email && <AlertCircle aria-hidden="true" />}</div>{errors.email && <p className="login-error" id="email-error">{errors.email}</p>}</div>
          <div className="login-field"><label htmlFor="password">Senha</label><div className={`login-input${errors.password ? ' is-invalid' : ''}`}><input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => { setPassword(event.target.value); setErrors((current) => ({ ...current, password: undefined })) }} aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'password-error' : undefined} /><button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>{showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}</button></div>{errors.password && <p className="login-error" id="password-error">{errors.password}</p>}</div>
          <div className="login-options"><Link href="/em-breve">Esqueceu sua senha?</Link></div>
          <button className="login-submit" type="submit" aria-disabled={!formIsValid}>Entrar</button>
        </form>
        <div className="login-divider"><span>ou</span></div>
        <div className="social-login" aria-label="Outras opções de acesso">
          <button type="button"><svg className="google-icon" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7A19.9 19.9 0 0 0 24 4 20 20 0 1 0 44 24c0-1.4-.1-2.7-.4-4Z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8A12 12 0 0 1 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7A19.9 19.9 0 0 0 24 4 20 20 0 0 0 6.3 14.7Z"/><path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.5-5.2l-6.2-5.2A11.9 11.9 0 0 1 12.9 28l-6.5 5A20 20 0 0 0 24 44Z"/><path fill="#1976D2" d="M43.6 20H42V20H24v8h11.3a12 12 0 0 1-4 5.6l6.2 5.2C37.1 39.2 44 34 44 24c0-1.4-.1-2.7-.4-4Z"/></svg>Entrar com Google</button>
        </div>
        <p className="login-signup">Novo no CyberEduca+?<Link href="/cadastro"><span className="login-link-label">Criar minha conta</span></Link></p>
      </section>
    </div>
    <footer className="login-footer"><span>Copyright © 2026 <Link href="/">CyberEduca+</Link>.</span><span>Todos os direitos reservados. <Link href="/politicas#termos-de-uso">Termos de Uso</Link>, <Link href="/politicas#politica-de-privacidade">Política de Privacidade e LGPD</Link></span></footer>
  </main>
}
