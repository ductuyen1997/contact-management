import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { jsonResponse, renderRoute, signedInAs } from '../test/render'
import { ContactListPage } from './ContactListPage'

const contact = {
  id: 1, firstName: 'Alice', lastName: 'Nguyen', fullName: 'Alice Nguyen', email: 'alice@example.com',
  phone: '+84 90 123 4567', company: 'Acme', jobTitle: 'PM', address: null, notes: null,
  category: 'WORK', favorite: true, createdAt: '2026-01-01T00:00:00', updatedAt: '2026-01-01T00:00:00',
}

describe('ContactListPage', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('renders contacts and stats, passing URL filters to the API', async () => {
    const fetchMock = vi.fn((url: string) =>
      Promise.resolve(
        url.startsWith('/api/v1/contacts/stats')
          ? jsonResponse({ total: 12, favorites: 3, byCategory: { WORK: 3 } })
          : jsonResponse({ content: [contact], page: { size: 10, number: 0, totalElements: 1, totalPages: 1 } }),
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    renderRoute(<ContactListPage />, { path: '/contacts', url: '/contacts?category=WORK&q=ali' })

    expect(await screen.findByText('Alice Nguyen')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    const listUrl = fetchMock.mock.calls.map(([u]) => u).find((u) => !u.includes('stats'))
    expect(listUrl).toBe('/api/v1/contacts?q=ali&category=WORK&sort=NAME&page=0&size=10')
  })

  it('shows Export CSV only to admins, and downloads with the export filters', async () => {
    const fetchMock = vi.fn((url: string) =>
      Promise.resolve(
        url.startsWith('/api/v1/contacts/stats')
          ? jsonResponse({ total: 1, favorites: 1, byCategory: { WORK: 1 } })
          : url.startsWith('/api/v1/contacts/export')
            ? new Response('First name\nAlice', { headers: { 'Content-Disposition': 'attachment; filename="contacts.csv"' } })
            : jsonResponse({ content: [contact], page: { size: 10, number: 0, totalElements: 1, totalPages: 1 } }),
      ),
    )
    vi.stubGlobal('fetch', fetchMock)
    URL.createObjectURL = vi.fn(() => 'blob:csv')
    URL.revokeObjectURL = vi.fn()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    const asUser = renderRoute(<ContactListPage />, { path: '/contacts', url: '/contacts?category=WORK&q=ali' })
    expect(await screen.findByText('Alice Nguyen')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Export CSV' })).not.toBeInTheDocument()
    asUser.unmount()

    renderRoute(<ContactListPage />, {
      path: '/contacts', url: '/contacts?category=WORK&q=ali', auth: signedInAs(['USER', 'ADMIN']),
    })
    await userEvent.click(await screen.findByRole('button', { name: 'Export CSV' }))

    await waitFor(() => expect(click).toHaveBeenCalled())
    click.mockRestore()
    expect(fetchMock.mock.calls.map(([u]) => u)).toContain('/api/v1/contacts/export?q=ali&category=WORK&sort=NAME')
  })
})
