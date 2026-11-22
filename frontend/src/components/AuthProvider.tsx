import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { authApi, type AuthResponse, type Credentials } from '../api/auth'
import { setUnauthorizedHandler } from '../api/http'
import { AuthContext, type AuthApi } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { clearSession, loadSession, saveSession, type Session } from '../lib/session'

/** Longest delay `setTimeout` supports (about 24.8 days); longer delays would fire immediately. */
const MAX_TIMEOUT_MS = 2 ** 31 - 1

/** Converts the server's login response into what we keep in the browser. */
function toSession(response: AuthResponse): Session {
  return {
    token: response.accessToken,
    username: response.user.username,
    roles: response.user.roles,
    expiresAt: Date.parse(response.expiresAt),
  }
}

/**
 * Owns the signed-in session and shares it with the whole app through AuthContext.
 * Components read it with `useAuth()` (see hooks/useAuth.ts).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // Passing the function itself (not `loadSession()`) makes React call it only on the first render,
  // so a page reload stays signed in without reading localStorage on every render.
  const [session, setSession] = useState<Session | null>(loadSession)
  const queryClient = useQueryClient()
  const toast = useToast()

  // Mirrors `session !== null`, but readable inside callbacks without re-creating them.
  // Used to react only once when several requests fail with 401 at the same moment.
  const signedIn = useRef(session !== null)
  useEffect(() => {
    signedIn.current = session !== null
  }, [session])

  const logout = useCallback(() => {
    clearSession()
    setSession(null)
    queryClient.clear()   // don't leave the previous user's data in the cache
  }, [queryClient])

  /** Signs out because the token is no longer valid, and tells the user why. */
  const expire = useCallback(() => {
    if (!signedIn.current) return
    signedIn.current = false
    logout()
    toast.show('Your session has expired. Please sign in again.', 'error')
  }, [logout, toast])

  /** Starts a session from a successful login or registration. */
  const start = useCallback((response: AuthResponse) => {
    const next = toSession(response)
    saveSession(next)
    queryClient.clear()   // start with an empty cache for the new user
    setSession(next)
  }, [queryClient])

  // The server rejected our token (it expired, or the server's secret changed): sign out.
  // api/http.ts calls this handler; the cleanup function removes it again when this component goes away.
  useEffect(() => {
    setUnauthorizedHandler(expire)
    return () => setUnauthorizedHandler(() => {})
  }, [expire])

  // Also sign out when the token's lifetime ends, even if the user is idle and sends no requests.
  // Re-runs whenever the session changes; the cleanup cancels the previous session's timer.
  useEffect(() => {
    if (!session) return
    const timer = setTimeout(expire, Math.min(session.expiresAt - Date.now(), MAX_TIMEOUT_MS))
    return () => clearTimeout(timer)
  }, [session, expire])

  // The object every `useAuth()` call receives. `useMemo` keeps the same object between renders
  // unless the session changes, so components using it only re-render when something really changed.
  const api = useMemo<AuthApi>(() => ({
    user: session ? { username: session.username, roles: session.roles } : null,
    isAdmin: session?.roles.includes('ADMIN') ?? false,
    login: async (credentials: Credentials) => start(await authApi.login(credentials)),
    register: async (credentials: Credentials) => start(await authApi.register(credentials)),
    logout,
  }), [session, start, logout])

  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>
}
