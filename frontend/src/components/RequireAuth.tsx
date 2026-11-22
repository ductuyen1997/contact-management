import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from '../hooks/useAuth'

/**
 * Guards pages that need a signed-in user: wrap them in it, e.g. `<RequireAuth><Layout /></RequireAuth>`.
 * Signed-out visitors are sent to the login page, which sends them back here after they sign in
 * (the requested URL travels along in `state.from`; AuthPage reads it).
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    // replace: the protected URL isn't kept in history, so Back doesn't bounce to the login page again
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  return children
}
