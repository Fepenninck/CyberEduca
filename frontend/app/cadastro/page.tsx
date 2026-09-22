'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import '../login/login.css'

type Errors = { name?: string; email?: string; password?: string; confirmPassword?: string; terms?: string }

const VisibilityIcon = () => <svg className="visibility-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5Zm0 12.5a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" /></svg>
const VisibilityOffIcon = () => <svg className="visibility-off-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5Zm0 12.5a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" /><path className="visibility-off-cut" d="M4 4 20 20" /><path className="visibility-off-slash" d="M4 4 20 20" /></svg>

export default function CadastroPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [errors, setErrors] = useState<Errors>({})

  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const formIsValid = name.trim().length >= 2 && emailIsValid && password.length >= 8 && password === confirmPassword && acceptedTerms

  const clearError = (field: keyof Errors) => setErrors((current) => ({ ...current, [field]: undefined }))

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors: Errors = {}
    if (!name.trim()) nextErrors.name = 'Informe seu nome.'
    else if (name.trim().length < 2) nextErrors.name = 'Digite um nome válido.'
    if (!email.trim()) nextErrors.email = 'Informe seu e-mail.'
    else if (!emailIsValid) nextErrors.email = 'Digite um e-mail válido.'
    if (!password) nextErrors.password = 'Crie uma senha.'
    else if (password.length < 8) nextErrors.password = 'A senha deve ter pelo menos 8 caracteres.'
    if (!confirmPassword) nextErrors.confirmPassword = 'Confirme sua senha.'
    else if (password !== confirmPassword) nextErrors.confirmPassword = 'As senhas não coincidem.'
    if (!acceptedTerms) nextErrors.terms = 'Você precisa aceitar os termos para continuar.'
    setErrors(nextErrors)
  }

  return <main className="login-page signup-page">
    <div className="login-shell">
      <Link href="/" className="login-brand" aria-label="Voltar para o início do CyberEduca+"><img src="/cybereduca-logo.png" alt="CyberEduca+" /></Link>
      <section className="login-card signup-card" aria-labelledby="signup-title">
        <h1 id="signup-title">Crie sua conta</h1>
        <form onSubmit={submit} noValidate>
          <div className="login-field"><label htmlFor="name">Nome</label><div className={`login-input${errors.name ? ' is-invalid' : ''}`}><input id="name" name="name" type="text" autoComplete="name" value={name} onChange={(event) => { setName(event.target.value); clearError('name') }} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'name-error' : undefined} />{errors.name && <AlertCircle aria-hidden="true" />}</div>{errors.name && <p className="login-error" id="name-error">{errors.name}</p>}</div>

          <div className="login-field"><label htmlFor="signup-email">E-mail</label><div className={`login-input${errors.email ? ' is-invalid' : ''}`}><input id="signup-email" name="signup-email" type="email" autoComplete="email" value={email} onChange={(event) => { setEmail(event.target.value); clearError('email') }} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'signup-email-error' : undefined} />{errors.email && <AlertCircle aria-hidden="true" />}</div>{errors.email && <p className="login-error" id="signup-email-error">{errors.email}</p>}</div>

          <div className="login-field"><label htmlFor="signup-password">Senha</label><div className={`login-input${errors.password ? ' is-invalid' : ''}`}><input id="signup-password" name="signup-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(event) => { setPassword(event.target.value); clearError('password') }} aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'signup-password-error' : undefined} /><button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>{showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}</button></div>{errors.password && <p className="login-error" id="signup-password-error">{errors.password}</p>}</div>

          <div className="login-field"><label htmlFor="confirm-password">Confirmar senha</label><div className={`login-input${errors.confirmPassword ? ' is-invalid' : ''}`}><input id="confirm-password" name="confirm-password" type={showConfirmPassword ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); clearError('confirmPassword') }} aria-invalid={Boolean(errors.confirmPassword)} aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined} /><button type="button" className="password-toggle" onClick={() => setShowConfirmPassword((visible) => !visible)} aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}>{showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}</button></div>{errors.confirmPassword && <p className="login-error" id="confirm-password-error">{errors.confirmPassword}</p>}</div>

          <label className="signup-terms"><input type="checkbox" checked={acceptedTerms} onChange={(event) => { setAcceptedTerms(event.target.checked); clearError('terms') }} /><span className="remember-box" aria-hidden="true" /><span>Li e aceito os <Link href="/politicas#termos-de-uso">Termos de Uso</Link> e a <Link href="/politicas#politica-de-privacidade">Política de Privacidade e LGPD</Link>.</span></label>
          {errors.terms && <p className="login-error signup-terms-error">{errors.terms}</p>}

          <button className="login-submit" type="submit" aria-disabled={!formIsValid}>Criar conta</button>
        </form>

        <div className="login-divider"><span>ou</span></div>
        <div className="social-login"><button type="button"><svg className="google-icon" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7A19.9 19.9 0 0 0 24 4 20 20 0 1 0 44 24c0-1.4-.1-2.7-.4-4Z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8A12 12 0 0 1 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7A19.9 19.9 0 0 0 24 4 20 20 0 0 0 6.3 14.7Z"/><path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.5-5.2l-6.2-5.2A11.9 11.9 0 0 1 12.9 28l-6.5 5A20 20 0 0 0 24 44Z"/><path fill="#1976D2" d="M43.6 20H42V20H24v8h11.3a12 12 0 0 1-4 5.6l6.2 5.2C37.1 39.2 44 34 44 24c0-1.4-.1-2.7-.4-4Z"/></svg>Criar conta com Google</button></div>
        <p className="login-signup">Já possui uma conta?<Link href="/login"><span className="login-link-label">Entrar</span></Link></p>
      </section>
    </div>
    <footer className="login-footer"><span>Copyright © 2026 <Link href="/">CyberEduca+</Link>.</span><span>Todos os direitos reservados. <Link href="/politicas#termos-de-uso">Termos de Uso</Link>, <Link href="/politicas#politica-de-privacidade">Política de Privacidade e LGPD</Link></span></footer>
  </main>
}
