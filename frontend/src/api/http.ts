import { loadSession } from '../lib/session'

/** RFC 9457 problem detail as returned by the services and the gateway. */
export interface ProblemDetail {
  status: number
  title?: string
  detail?: string
  errors?: Record<string, string>
}

export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: Record<string, string>

  constructor(problem: ProblemDetail) {
    super(problem.detail || problem.title || `Request failed with status ${problem.status}`)
    this.name = 'ApiError'
    this.status = problem.status
    this.fieldErrors = problem.errors ?? {}
  }
}

export type QueryParams = Record<string, string | number | boolean | undefined | null>

export function toQueryString(params: QueryParams = {}): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '' || value === false) continue
    search.set(key, String(value))
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

let onUnauthorized: () => void = () => {}

/** Called when the server rejects our token (expired or revoked), so the app can sign the user out. */
export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler
}

async function send(path: string, init: RequestInit, accept: string): Promise<Response> {
  const headers = new Headers(init.headers)
  headers.set('Accept', accept)
  if (init.body !== undefined) headers.set('Content-Type', 'application/json')
  const token = loadSession()?.token
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(path, { ...init, headers })
  } catch {
    throw new ApiError({ status: 0, title: 'Network error', detail: 'Cannot reach the server.' })
  }

  if (!response.ok) {
    let problem: ProblemDetail = { status: response.status }
    try {
      problem = { ...problem, ...(await response.json()) }
    } catch {
      // non-JSON error body (e.g. gateway HTML) - keep the status only
    }
    // A 401 on a request that carried a token means the session is no longer valid.
    // (A failed login sends no token, so it is reported to the form instead.)
    if (response.status === 401 && token) onUnauthorized()
    if (response.status === 403 && !problem.detail) {
      problem.detail = 'You do not have permission to do that.'
    }
    throw new ApiError(problem)
  }
  return response
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await send(path, init, 'application/json')
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

/** Downloads a file through fetch so the Authorization header is sent (a plain link can't send it). */
export async function downloadFile(path: string, fallbackName: string): Promise<void> {
  const response = await send(path, {}, '*/*')
  const disposition = response.headers.get('Content-Disposition') ?? ''
  const filename = /filename="?([^";]+)"?/.exec(disposition)?.[1] ?? fallbackName
  const url = URL.createObjectURL(await response.blob())
  try {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
  } finally {
    URL.revokeObjectURL(url)
  }
}
