import { request, toQueryString } from './http'
import type { Contact, ContactFilter, ContactInput, ContactStats, Page } from './types'

const BASE = '/api/v1/contacts'

export const contactsApi = {
  list: (filter: ContactFilter) => request<Page<Contact>>(BASE + toQueryString({ ...filter })),
  stats: () => request<ContactStats>(`${BASE}/stats`),
  get: (id: number) => request<Contact>(`${BASE}/${id}`),
  create: (input: ContactInput) => request<Contact>(BASE, { method: 'POST', body: JSON.stringify(input) }),
  update: (id: number, input: ContactInput) =>
    request<Contact>(`${BASE}/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
  toggleFavorite: (id: number) => request<Contact>(`${BASE}/${id}/favorite`, { method: 'PATCH' }),
  remove: (id: number) => request<void>(`${BASE}/${id}`, { method: 'DELETE' }),
  exportUrl: (filter: ContactFilter) =>
    `${BASE}/export` + toQueryString({ q: filter.q, category: filter.category, favorites: filter.favorites, sort: filter.sort }),
}
