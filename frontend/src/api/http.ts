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

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body !== undefined) headers.set('Content-Type', 'application/json')

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
    throw new ApiError(problem)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}
