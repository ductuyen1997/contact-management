import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { jsonResponse, renderRoute } from '../test/render'
import { ContactFormPage } from './ContactFormPage'

describe('ContactFormPage', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('validates required fields on the client without calling the API', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    renderRoute(<ContactFormPage />, { path: '/contacts/new', url: '/contacts/new' })

    await userEvent.click(screen.getByRole('button', { name: 'Create contact' }))

    expect(await screen.findByText('First name is required')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shows server-side duplicate email error on the email field', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({
      status: 409,
      title: 'Duplicate email',
      detail: 'Another contact already uses this email',
      errors: { email: 'Another contact already uses this email' },
    }, 409)))
    renderRoute(<ContactFormPage />, { path: '/contacts/new', url: '/contacts/new' })

    await userEvent.type(screen.getByLabelText('First name *'), 'Zed')
    await userEvent.type(screen.getByLabelText('Email'), 'alice@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Create contact' }))

    expect(await screen.findByText('Another contact already uses this email')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
  })

  it('creates the contact and navigates to its page', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 42, fullName: 'Zed Test' }, 201))
    vi.stubGlobal('fetch', fetchMock)
    const { router } = renderRoute(<ContactFormPage />, { path: '/contacts/new', url: '/contacts/new' })

    await userEvent.type(screen.getByLabelText('First name *'), 'Zed')
    await userEvent.type(screen.getByLabelText('Last name'), 'Test')
    await userEvent.click(screen.getByRole('button', { name: 'Create contact' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/contacts/42'))
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/v1/contacts')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toMatchObject({ firstName: 'Zed', lastName: 'Test', category: 'OTHER' })
  })
})
