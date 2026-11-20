import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { ToastProvider } from '../components/ToastProvider'
import { AuthContext, type AuthApi } from '../hooks/useAuth'

export const signedInAs = (roles: string[] = ['USER']): AuthApi => ({
  user: { username: 'tester', roles },
  isAdmin: roles.includes('ADMIN'),
  login: () => Promise.resolve(),
  register: () => Promise.resolve(),
  logout: () => {},
})

/** Renders `element` at `path` inside the same providers the app uses, signed in as `auth` (a USER by default). */
export function renderRoute(element: ReactElement, { path = '/', url = '/', auth = signedInAs() } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter(
    [
      { path, element },
      { path: '*', element: <div data-testid="navigated" /> },
    ],
    { initialEntries: [url] },
  )
  return {
    router,
    ...render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthContext.Provider value={auth}>
            <RouterProvider router={router} />
          </AuthContext.Provider>
        </ToastProvider>
      </QueryClientProvider>,
    ),
  }
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}
