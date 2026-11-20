import { createContext, useContext } from 'react'
import type { AuthUser, Credentials } from '../api/auth'

export interface AuthApi {
  user: AuthUser | null
  isAdmin: boolean
  login: (credentials: Credentials) => Promise<void>
  register: (credentials: Credentials) => Promise<void>
  logout: () => void
}

const signedOut = () => Promise.reject(new Error('AuthProvider is missing'))

export const AuthContext = createContext<AuthApi>({
  user: null,
  isAdmin: false,
  login: signedOut,
  register: signedOut,
  logout: () => {},
})

export function useAuth(): AuthApi {
  return useContext(AuthContext)
}
