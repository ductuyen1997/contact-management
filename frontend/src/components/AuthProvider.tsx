import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { authApi, type AuthResponse, type Credentials } from '../api/auth'
import { setUnauthorizedHandler } from '../api/http'
import { AuthContext, type AuthApi } from '../hooks/useAuth'
import { clearSession, loadSession, saveSession, type Session } from '../lib/session'
import { useToast } from '../hooks/useToast'

function toSession(response: AuthResponse): Session {
  return {
    token: response.accessToken,
    username: response.user.username,
    roles: response.user.roles,
    expiresAt: Date.parse(response.expiresAt),
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(loadSession)
  const queryClient = useQueryClient()
  const toast = useToast()
  const signedIn = useRef(session !== null)
  useEffect(() => {
    signedIn.current = session !== null
  }, [session])

  const logout = useCallback(() => {
    clearSession()
    setSession(null)
    queryClient.clear()   // don't leave the previous user's data in the cache
  }, [queryClient])

  const start = useCallback((response: AuthResponse) => {
    const next = toSession(response)
    saveSession(next)
    queryClient.clear()
    setSession(next)
  }, [queryClient])

  // The server rejected our token (e.g. it expired or the secret changed): sign out and say why
  useEffect(() => {
    setUnauthorizedHandler(() => {
      // Several requests can fail at once; only the first one signs out and shows the message
      if (!signedIn.current) return
      signedIn.current = false
      logout()
      toast.show('Your session has expired. Please sign in again.', 'error')
    })
    return () => setUnauthorizedHandler(() => {})
  }, [logout, toast])

  // Sign out when the token's lifetime ends, even if the user is idle
  useEffect(() => {
    if (!session) return
    const timer = setTimeout(logout, Math.min(session.expiresAt - Date.now(), 2 ** 31 - 1))
    return () => clearTimeout(timer)
  }, [session, logout])

  const api = useMemo<AuthApi>(() => ({
    user: session ? { username: session.username, roles: session.roles } : null,
    isAdmin: session?.roles.includes('ADMIN') ?? false,
    login: async (credentials: Credentials) => start(await authApi.login(credentials)),
    register: async (credentials: Credentials) => start(await authApi.register(credentials)),
    logout,
  }), [session, start, logout])

  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>
}
