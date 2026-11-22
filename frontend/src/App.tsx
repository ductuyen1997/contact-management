import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'
import { ApiError } from './api/http'
import { AuthProvider } from './components/AuthProvider'
import { Layout } from './components/Layout'
import { RequireAuth } from './components/RequireAuth'
import { ToastProvider } from './components/ToastProvider'
import { ActivityPage } from './pages/ActivityPage'
import { AuthPage } from './pages/AuthPage'
import { ContactDetailPage } from './pages/ContactDetailPage'
import { ContactFormPage } from './pages/ContactFormPage'
import { ContactListPage } from './pages/ContactListPage'
import { NotFoundPage } from './pages/NotFoundPage'

/**
 * Should a failed request be tried again?
 * Client errors (4xx: not found, forbidden, invalid input…) will fail again, so no.
 * Network problems and server errors (5xx) may be temporary, so retry up to 2 times.
 */
function shouldRetry(failureCount: number, error: Error): boolean {
  const isClientError = error instanceof ApiError && error.status >= 400 && error.status < 500
  return !isClientError && failureCount < 2
}

/** Caches data loaded from the server (TanStack Query), shared by every page. */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,   // data younger than 10 s is shown without asking the server again
      retry: shouldRetry,
    },
  },
})

/** Which page to show for which URL. */
const router = createBrowserRouter([
  // Public pages
  { path: 'login', element: <AuthPage mode="login" /> },
  { path: 'register', element: <AuthPage mode="register" /> },
  {
    // Every other page requires a signed-in user, and is shown inside the Layout (top bar + page area).
    element: <RequireAuth><Layout /></RequireAuth>,
    children: [
      { index: true, element: <Navigate to="/contacts" replace /> },   // "/" goes to the contact list
      { path: 'contacts', element: <ContactListPage /> },
      { path: 'contacts/new', element: <ContactFormPage /> },
      { path: 'contacts/:id', element: <ContactDetailPage /> },
      { path: 'contacts/:id/edit', element: <ContactFormPage /> },
      { path: 'activity', element: <ActivityPage /> },
      { path: '*', element: <NotFoundPage /> },   // any other URL
    ],
  },
])

/**
 * The root component. Each provider makes something available to every component inside it:
 * the server-data cache, toast messages, and the signed-in user. Then the router shows the page.
 * The order matters: AuthProvider uses both the cache and toasts, so it must sit inside them.
 */
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  )
}
