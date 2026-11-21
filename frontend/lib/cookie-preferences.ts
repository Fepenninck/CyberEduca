export const CONSENT_COOKIE = 'cybereduca_cookie_consent'
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 180

export function readCookiePreferences(cookie: string): { personalization: boolean } | null {
  const value = cookie.split(';').map(part => part.trim()).find(part => part.startsWith(`${CONSENT_COOKIE}=`))?.slice(CONSENT_COOKIE.length + 1)
  // Old choices did not describe this optional storage. Ask again once.
  if (value === 'v2-personalization') return { personalization: true }
  if (value === 'v2-essential') return { personalization: false }
  return null
}

export function canRememberCelebrations() {
  return typeof document !== 'undefined' && readCookiePreferences(document.cookie)?.personalization === true
}

export function clearRememberedCelebrations() {
  try {
    for (let index = localStorage.length - 1; index >= 0; index--) {
      const key = localStorage.key(index)
      if (key?.startsWith('cybereduca-achievement:')) localStorage.removeItem(key)
    }
  } catch { /* Browsers can block local storage. */ }
}

export function saveCookiePreferences(allowPersonalization: boolean) {
  document.cookie = `${CONSENT_COOKIE}=${allowPersonalization ? 'v2-personalization' : 'v2-essential'}; Max-Age=${CONSENT_MAX_AGE}; Path=/; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`
  if (!allowPersonalization) clearRememberedCelebrations()
  return readCookiePreferences(document.cookie)?.personalization === allowPersonalization
}
