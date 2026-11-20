import { afterEach, describe, expect, it, vi } from 'vitest'
import { saveSession } from '../lib/session'
import { jsonResponse } from '../test/render'
import { ApiError, request, setUnauthorizedHandler } from './http'

const session = { token: 'abc', username: 'alice', roles: ['USER'], expiresAt: Date.now() + 60_000 }

describe('request', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
    setUnauthorizedHandler(() => {})
  })

  it('sends the bearer token of the current session', async () => {
    saveSession(session)
    const fetchMock = vi.fn<typeof fetch>(() => Promise.resolve(jsonResponse({ ok: true })))
    vi.stubGlobal('fetch', fetchMock)

    await request('/api/v1/contacts')

    const headers = fetchMock.mock.calls[0][1]?.headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer abc')
  })

  it('sends no Authorization header when signed out', async () => {
    const fetchMock = vi.fn<typeof fetch>(() => Promise.resolve(jsonResponse({ ok: true })))
    vi.stubGlobal('fetch', fetchMock)

    await request('/api/v1/auth/login', { method: 'POST', body: '{}' })

    expect((fetchMock.mock.calls[0][1]?.headers as Headers).has('Authorization')).toBe(false)
  })

  it('reports a rejected token so the app can sign out', async () => {
    saveSession(session)
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(null, { status: 401 }))))
    const onUnauthorized = vi.fn()
    setUnauthorizedHandler(onUnauthorized)

    await expect(request('/api/v1/contacts')).rejects.toBeInstanceOf(ApiError)
    expect(onUnauthorized).toHaveBeenCalledOnce()
  })

  it('explains a 403 that has no body', async () => {
    saveSession(session)
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(null, { status: 403 }))))

    await expect(request('/api/v1/contacts/1', { method: 'DELETE' }))
      .rejects.toThrow('You do not have permission to do that.')
  })

  it('ignores an expired stored session', async () => {
    saveSession({ ...session, expiresAt: Date.now() - 1 })
    const fetchMock = vi.fn<typeof fetch>(() => Promise.resolve(jsonResponse({ ok: true })))
    vi.stubGlobal('fetch', fetchMock)

    await request('/api/v1/contacts')

    expect((fetchMock.mock.calls[0][1]?.headers as Headers).has('Authorization')).toBe(false)
  })
})
