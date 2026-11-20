import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { AuthProvider } from '../components/AuthProvider'
import { RequireAuth } from '../components/RequireAuth'
import { ToastProvider } from '../components/ToastProvider'
import { loadSession } from '../lib/session'
import { jsonResponse } from '../test/render'
import { AuthPage } from './AuthPage'

const authResponse = (username: string, roles: string[]) => ({
  accessToken: 'token-123',
  tokenType: 'Bearer',
  expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
  user: { username, roles },
})

/** Renders the real AuthProvider + routes, starting at `url`. */
function renderApp(url: string) {
  const router = createMemoryRouter(
    [
      { path: '/login', element: <AuthPage mode="login" /> },
      { path: '/register', element: <AuthPage mode="register" /> },
      { path: '/contacts', element: <RequireAuth><p>contacts page</p></RequireAuth> },
    ],
    { initialEntries: [url] },
  )
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ToastProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>,
  )
  return router
}

describe('authentication', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it('redirects to login, then back to the requested page after signing in', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(jsonResponse(authResponse('alice', ['USER']))))
    vi.stubGlobal('fetch', fetchMock)
    const router = renderApp('/contacts')

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Username'), 'alice')
    await userEvent.type(screen.getByLabelText('Password'), 'secret-pass')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('contacts page')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/contacts')
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/auth/login', expect.objectContaining({
      method: 'POST', body: JSON.stringify({ username: 'alice', password: 'secret-pass' }),
    }))
    expect(loadSession()).toMatchObject({ token: 'token-123', username: 'alice', roles: ['USER'] })
  })

  it('shows the server message when the login is rejected', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(
      jsonResponse({ status: 401, title: 'Login failed', detail: 'Invalid username or password' }, 401),
    )))
    renderApp('/login')

    await userEvent.type(screen.getByLabelText('Username'), 'alice')
    await userEvent.type(screen.getByLabelText('Password'), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid username or password')
    expect(loadSession()).toBeNull()
  })

  it('validates registration before calling the server, and maps a taken username onto the field', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(jsonResponse({
      status: 409, title: 'Username taken', errors: { username: "Username 'alice' is already taken" },
    }, 409)))
    vi.stubGlobal('fetch', fetchMock)
    renderApp('/register')

    await userEvent.type(screen.getByLabelText('Username'), 'alice')
    await userEvent.type(screen.getByLabelText('Password'), 'short')
    await userEvent.type(screen.getByLabelText('Confirm password'), 'different')
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByText('Password must be 8-72 characters')).toBeInTheDocument()
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()

    await userEvent.clear(screen.getByLabelText('Password'))
    await userEvent.type(screen.getByLabelText('Password'), 'long-enough')
    await userEvent.clear(screen.getByLabelText('Confirm password'))
    await userEvent.type(screen.getByLabelText('Confirm password'), 'long-enough')
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByText("Username 'alice' is already taken")).toBeInTheDocument()
  })
})
