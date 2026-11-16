// Share concurrent reads only. Completed responses are never cached.
export function createInflightRequests() {
  const pending = new Map<string, Promise<Response>>()
  return {
    clear() { pending.clear() },
    read(key: string, request: () => Promise<Response>, signal?: AbortSignal | null): Promise<Response> {
      if (signal?.aborted) return Promise.reject(signal.reason)
      let response = pending.get(key)
      if (!response) {
        response = Promise.resolve().then(request).finally(() => {
          if (pending.get(key) === response) pending.delete(key)
        })
        pending.set(key, response)
      }
      // Each reader has its own body and cancellation. Cancelling one component
      // must not cancel a request another mounted component still needs.
      return new Promise((resolve, reject) => {
        const abort = () => reject(signal?.reason)
        signal?.addEventListener('abort', abort, { once: true })
        response.then(value => {
          signal?.removeEventListener('abort', abort)
          if (!signal?.aborted) {
            try { resolve(value.clone()) } catch (error) { reject(error) }
          }
        }, error => {
          signal?.removeEventListener('abort', abort)
          reject(error)
        })
      })
    },
  }
}
