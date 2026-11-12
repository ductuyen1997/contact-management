import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'
import { Layout } from './components/Layout'
import { ToastProvider } from './components/ToastProvider'
import { ApiError } from './api/http'
import { ActivityPage } from './pages/ActivityPage'
import { ContactDetailPage } from './pages/ContactDetailPage'
import { ContactFormPage } from './pages/ContactFormPage'
import { ContactListPage } from './pages/ContactListPage'
import { NotFoundPage } from './pages/NotFoundPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      // Don't retry client errors (404, 400...); retry transient failures twice
      retry: (count, error) => !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 2,
    },
  },
})

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/contacts" replace /> },
      { path: 'contacts', element: <ContactListPage /> },
      { path: 'contacts/new', element: <ContactFormPage /> },
      { path: 'contacts/:id', element: <ContactDetailPage /> },
      { path: 'contacts/:id/edit', element: <ContactFormPage /> },
      { path: 'activity', element: <ActivityPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>
  )
}
