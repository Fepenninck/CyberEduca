import { beginLoading } from './loading-state'

let readyAt = 0
let pending: Promise<void> | null = null
// Probe without navigating: hosting startup HTML never replaces the application.
export function waitForBackend(): Promise<void> {
  if (Date.now() - readyAt < 30000) return Promise.resolve()
  if (pending) return pending
  const end = beginLoading('Conectando ao CyberEduca+…')
  pending = (async () => {
    const deadline = Date.now() + 90000
    while (Date.now() < deadline) {
      try {
        const response = await fetch('/api/usuarios/me', { credentials: 'include', cache: 'no-store', redirect: 'error', headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(Math.min(12000, Math.max(1, deadline - Date.now()))) })
        if (response.status < 500 && response.headers.get('content-type')?.includes('application/json')) { readyAt = Date.now(); return }
      } catch { /* The next probe waits for the backend to finish starting. */ }
      await new Promise(resolve => setTimeout(resolve, Math.min(1500, Math.max(0, deadline - Date.now()))))
    }
    throw new Error('O servidor demorou para responder. Tente novamente em instantes.')
  })().finally(() => { pending = null; end() })
  return pending
}
