/** The signed-in user's access token and identity, kept in localStorage so a reload stays signed in. */
export interface Session {
  token: string
  username: string
  roles: string[]
  /** Epoch milliseconds when the token stops being accepted. */
  expiresAt: number
}

const KEY = 'contact-manager.session'

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as Session
    if (typeof session.token !== 'string' || !(session.expiresAt > Date.now())) {
      localStorage.removeItem(KEY)
      return null
    }
    return session
  } catch {
    return null
  }
}

export function saveSession(session: Session): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(session))
  } catch {
    // storage unavailable (private mode) - the session then lasts only for this page load
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
