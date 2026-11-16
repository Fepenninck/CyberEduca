export async function fetchWithTimeout(input: RequestInfo | URL, options?: RequestInit, timeoutMs = 30000): Promise<Response> {
  const controller = new AbortController()
  const caller = options?.signal
  const abort = () => controller.abort(caller?.reason)
  if (caller?.aborted) abort()
  else caller?.addEventListener('abort', abort, { once: true })
  const timer = setTimeout(() => controller.abort(new DOMException('O servidor demorou para responder. Tente novamente.', 'TimeoutError')), timeoutMs)
  try {
    return await fetch(input, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
    caller?.removeEventListener('abort', abort)
  }
}
