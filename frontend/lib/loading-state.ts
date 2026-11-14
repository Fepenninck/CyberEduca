const listeners = new Set<() => void>()
let active = 0
const SHOW_DELAY_MS = 200
const MIN_VISIBLE_MS = 650
let visibleAt = 0
let showTimer: ReturnType<typeof setTimeout> | undefined
let hideTimer: ReturnType<typeof setTimeout> | undefined
const empty = { visible: false, label: 'Carregando' }
let snapshot = empty
export const getLoadingSnapshot = () => snapshot
export const getServerLoadingSnapshot = () => empty
export function subscribeLoading(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener) } }
function emit() { for (const listener of listeners) listener() }
export function beginLoading(label = 'Carregando…') {
  if (typeof window === 'undefined') return () => {}
  active++
  if (hideTimer) clearTimeout(hideTimer)
  if (!snapshot.visible && !showTimer) {
    showTimer = setTimeout(() => {
      showTimer = undefined
      if (!active) return
      visibleAt = Date.now()
      snapshot = { visible: true, label: 'Carregando' }
      emit()
    }, SHOW_DELAY_MS)
  }
  let ended = false
  return () => {
    if (ended) return
    ended = true
    active = Math.max(0, active - 1)
    if (active) return
    if (showTimer) { clearTimeout(showTimer); showTimer = undefined }
    if (!snapshot.visible) return
    hideTimer = setTimeout(() => {
      hideTimer = undefined
      if (active) return
      snapshot = empty
      emit()
    }, Math.max(0, MIN_VISIBLE_MS - (Date.now() - visibleAt)))
  }
}
let routeEnd: (() => void) | undefined
let routeTimeout: ReturnType<typeof setTimeout> | undefined
export function finishRouteLoading() { if (routeTimeout) clearTimeout(routeTimeout); routeEnd?.(); routeEnd = undefined }
export function beginRouteLoading() {
  finishRouteLoading()
  routeEnd = beginLoading('Abrindo página…')
  routeTimeout = setTimeout(finishRouteLoading, 15000)
}
