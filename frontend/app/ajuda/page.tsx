'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { CyberHeader } from '@/components/cyber-header'
import { SiteFooter } from '@/components/site-footer'
import '../footer.css'

const MESSAGE_LIMIT = 1000

const questions = [
  ['Esqueci minha senha. O que devo fazer?', 'Na tela de login, selecione “Esqueci minha senha” e siga as instruções para redefinir sua senha.'],
  ['Como funcionam as trilhas de aprendizagem?', 'As trilhas organizam aulas e atividades em uma sequência de aprendizado, permitindo que você avance gradualmente pelos conteúdos.'],
  ['Como meu progresso é registrado?', 'Ao concluir aulas, atividades e avaliações, seu progresso é registrado para que você possa acompanhar sua evolução na plataforma.'],
  ['Preciso concluir as trilhas em uma ordem específica?', 'Sim. As trilhas seguem uma sequência de aprendizado, começando pelo nível Básico e avançando gradualmente para os níveis Intermediário e Avançado.'],
  ['Para que meus dados pessoais são utilizados?', 'Seus dados são utilizados para permitir o funcionamento da sua conta, disponibilizar os recursos da plataforma, registrar seu progresso e oferecer uma experiência adequada durante o uso do CyberEduca+.'],
  ['Posso solicitar a alteração ou exclusão dos meus dados?', 'Sim. Você pode solicitar acesso, correção ou, quando aplicável, exclusão dos seus dados pessoais, conforme a LGPD e a Política de Privacidade da plataforma.'],
]

export default function AjudaPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const body = `Nome: ${form.name}\nE-mail: ${form.email}\nTelefone: ${form.phone || 'Não informado'}\n\n${form.message}`
    window.location.href = `mailto:suporte@cybereduca.com?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(body)}`
  }

  const field = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = key === 'message' ? event.target.value.slice(0, MESSAGE_LIMIT) : event.target.value
    setForm({ ...form, [key]: value })
  }

  return (
    <main className="app-shell help-page">
      <CyberHeader />
      <section className="help-contact">
        <div className="help-contact-inner">
          <div className="help-contact-copy">
            <span className="help-kicker">Envie sua mensagem</span>
            <h1>Como podemos ajudar?</h1>
            <p>Preencha o formulário ao lado e nossa equipe entrará em contato para tirar dúvidas, receber sugestões ou resolver qualquer questão.</p>
          </div>

          <form className="help-form" onSubmit={submit}>
            <div className="help-form-grid">
              <label>Nome *<input value={form.name} onChange={field('name')} required /></label>
              <label>E-mail *<input type="email" value={form.email} onChange={field('email')} required /></label>
              <label>Assunto *<input value={form.subject} onChange={field('subject')} required /></label>
            </div>
            <label className="help-message-field">
              Mensagem *
              <textarea rows={6} value={form.message} onChange={field('message')} maxLength={MESSAGE_LIMIT} required />
              <span className="help-character-count">{form.message.length} / {MESSAGE_LIMIT} caracteres</span>
            </label>
            <button type="submit">Enviar mensagem</button>
          </form>
        </div>
      </section>

      <section className="help-faq-wrap">
        <div className="help-faq">
          <h2>Dúvidas frequentes</h2>
          {questions.map(([question, answer]) => (
            <details key={question}>
              <summary>{question}<ChevronDown size={18} /></summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
