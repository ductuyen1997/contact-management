import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { contactsApi } from '../api/contacts'
import { CATEGORIES, SORTS, type Category, type ContactFilter, type ContactSort } from '../api/types'
import { Avatar } from '../components/Avatar'
import { CategoryTag } from '../components/CategoryTag'
import { FavoriteButton } from '../components/FavoriteButton'
import { Pagination } from '../components/Pagination'
import { EmptyState, ErrorState, Spinner } from '../components/States'
import { useContactList, useContactStats } from '../hooks/useContacts'
import { useAuth } from '../hooks/useAuth'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useToast } from '../hooks/useToast'
import { CATEGORY_LABELS, SORT_LABELS } from '../lib/contact'

const PAGE_SIZE = 10

/** Filters live in the URL so they survive reloads and can be shared / bookmarked. */
function useFilterParams(): [ContactFilter, (patch: Partial<ContactFilter>) => void] {
  const [params, setParams] = useSearchParams()
  const category = params.get('category')
  const sort = params.get('sort')
  const filter: ContactFilter = {
    q: params.get('q') ?? '',
    category: CATEGORIES.includes(category as Category) ? (category as Category) : undefined,
    favorites: params.get('favorites') === 'true',
    sort: SORTS.includes(sort as ContactSort) ? (sort as ContactSort) : 'NAME',
    page: Math.max(Number(params.get('page') ?? 0) || 0, 0),
    size: PAGE_SIZE,
  }

  const update = (patch: Partial<ContactFilter>) => {
    const next = { ...filter, page: 0, ...patch }
    const search = new URLSearchParams()
    if (next.q) search.set('q', next.q)
    if (next.category) search.set('category', next.category)
    if (next.favorites) search.set('favorites', 'true')
    if (next.sort && next.sort !== 'NAME') search.set('sort', next.sort)
    if (next.page) search.set('page', String(next.page))
    setParams(search, { replace: true })
  }

  return [filter, update]
}

export function ContactListPage() {
  const [filter, setFilter] = useFilterParams()
  const [search, setSearch] = useState(filter.q ?? '')
  const debouncedSearch = useDebouncedValue(search)
  const contacts = useContactList(filter)
  const stats = useContactStats()
  const { isAdmin } = useAuth()

  useEffect(() => {
    if (debouncedSearch !== filter.q) setFilter({ q: debouncedSearch })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the debounced input
  }, [debouncedSearch])

  const allActive = !filter.category && !filter.favorites

  return (
    <>
      <section className="stats" aria-label="Summary">
        <button className={`stat${allActive ? ' active' : ''}`} onClick={() => setFilter({ category: undefined, favorites: false })}>
          <span className="stat-value">{stats.data?.total ?? '–'}</span>
          <span className="stat-label">All contacts</span>
        </button>
        <button className={`stat${filter.favorites ? ' active' : ''}`} onClick={() => setFilter({ favorites: !filter.favorites })}>
          <span className="stat-value">{stats.data?.favorites ?? '–'}</span>
          <span className="stat-label">★ Favorites</span>
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`stat${filter.category === cat ? ' active' : ''}`}
            onClick={() => setFilter({ category: filter.category === cat ? undefined : cat })}
          >
            <span className="stat-value">{stats.data ? (stats.data.byCategory[cat] ?? 0) : '–'}</span>
            <span className="stat-label">{CATEGORY_LABELS[cat]}</span>
          </button>
        ))}
      </section>

      <div className="toolbar">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, phone, company…"
          aria-label="Search contacts"
          autoFocus
        />
        <select
          value={filter.category ?? ''}
          onChange={(e) => setFilter({ category: (e.target.value || undefined) as Category | undefined })}
          aria-label="Category"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((cat) => <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>)}
        </select>
        <select value={filter.sort} onChange={(e) => setFilter({ sort: e.target.value as ContactSort })} aria-label="Sort">
          {SORTS.map((s) => <option key={s} value={s}>{SORT_LABELS[s]}</option>)}
        </select>
        <label className="check">
          <input type="checkbox" checked={!!filter.favorites} onChange={(e) => setFilter({ favorites: e.target.checked })} />
          Favorites
        </label>
        {isAdmin && <ExportButton filter={filter} />}
      </div>

      {contacts.isPending ? (
        <Spinner label="Loading contacts…" />
      ) : contacts.error ? (
        <ErrorState error={contacts.error} action={<button className="btn" onClick={() => contacts.refetch()}>Retry</button>} />
      ) : contacts.data.content.length === 0 ? (
        <EmptyState>
          <p>{stats.data?.total === 0 ? 'You have no contacts yet.' : 'No contacts match your filters.'}</p>
          <Link to="/contacts/new" className="btn btn-primary">Add a contact</Link>
        </EmptyState>
      ) : (
        <>
          <div className="card table-wrap" aria-busy={contacts.isFetching}>
            <table className="contacts">
              <thead>
                <tr>
                  <th>Name</th><th>Email</th><th>Phone</th>
                  <th className="hide-sm">Company</th><th className="hide-sm">Category</th><th />
                </tr>
              </thead>
              <tbody>
                {contacts.data.content.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link className="person" to={`/contacts/${c.id}`}>
                        <Avatar contact={c} />
                        <span>
                          <strong>{c.fullName}</strong>
                          {c.jobTitle && <small>{c.jobTitle}</small>}
                        </span>
                      </Link>
                    </td>
                    <td>{c.email ? <a href={`mailto:${c.email}`}>{c.email}</a> : <span className="muted">—</span>}</td>
                    <td>{c.phone ? <a href={`tel:${c.phone}`}>{c.phone}</a> : <span className="muted">—</span>}</td>
                    <td className="hide-sm">{c.company ?? '—'}</td>
                    <td className="hide-sm"><CategoryTag category={c.category} /></td>
                    <td className="actions">
                      <FavoriteButton contact={c} />
                      <Link className="icon-btn" to={`/contacts/${c.id}/edit`} title="Edit" aria-label={`Edit ${c.fullName}`}>✎</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={contacts.data.page.number}
            totalPages={contacts.data.page.totalPages}
            totalElements={contacts.data.page.totalElements}
            noun="contacts"
            onChange={(page) => setFilter({ page })}
          />
        </>
      )}
    </>
  )
}

/** CSV export is admin-only on the server; downloaded via fetch so the token is sent. */
function ExportButton({ filter }: { filter: ContactFilter }) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const onExport = async () => {
    setBusy(true)
    try {
      await contactsApi.exportCsv(filter)
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Export failed', 'error')
    } finally {
      setBusy(false)
    }
  }
  return (
    <button className="btn btn-ghost" type="button" onClick={onExport} disabled={busy}>
      {busy ? 'Exporting…' : 'Export CSV'}
    </button>
  )
}
