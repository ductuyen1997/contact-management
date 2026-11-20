import { request } from './http'

export interface Credentials {
  username: string
  password: string
}

export interface AuthUser {
  username: string
  roles: string[]
}

export interface AuthResponse {
  accessToken: string
  tokenType: 'Bearer'
  expiresAt: string
  user: AuthUser
}

const BASE = '/api/v1/auth'

export const authApi = {
  login: (credentials: Credentials) =>
    request<AuthResponse>(`${BASE}/login`, { method: 'POST', body: JSON.stringify(credentials) }),
  register: (credentials: Credentials) =>
    request<AuthResponse>(`${BASE}/register`, { method: 'POST', body: JSON.stringify(credentials) }),
}
