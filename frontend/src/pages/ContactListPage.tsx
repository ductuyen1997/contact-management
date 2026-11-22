import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { contactsApi } from '../api/contacts'
import { CATEGORIES, SORTS, type Category, type Contact, type ContactFilter, type ContactSort } from '../api/types'
import { Avatar } from '../components/Avatar'
import { CategoryTag } from '../components/CategoryTag'
import { FavoriteButton } from '../components/FavoriteButton'
import { Pagination } from '../components/Pagination'
import { EmptyState, ErrorState, Spinner } from '../components/States'
import { useAuth } from '../hooks/useAuth'
import { useContactList, useContactStats } from '../hooks/useContacts'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useToast } from '../hooks/useToast'
import { CATEGORY_LABELS, SORT_LABELS } from '../lib/contact'
import { parsePage } from '../lib/params'

const PAGE_SIZE = 10

/** Changes some of the filters, e.g. `setFilter({ favorites: true })`. */
type SetFilter = (changes: Partial<ContactFilter>) => void

/**
 * Keeps the list's filters in the URL (?q=ali&category=WORK&page=2), so they survive a reload
 * and the Back button, and a filtered list can be bookmarked or shared.
 * Returns the current filters and a function to change them, like `useState` does.
 */
function useFilterParams(): [ContactFilter & { q: string }, SetFilter] {
  const [params, setParams] = useSearchParams()
  const category = params.get('category')
  const sort = params.get('sort')

  // The URL can contain anything, so only accept known values
  const filter = {
    q: params.get('q') ?? '',
    category: CATEGORIES.includes(category as Category) ? (category as Category) : undefined,
    favorites: params.get('favorites') === 'true',
    sort: SORTS.includes(sort as ContactSort) ? (sort as ContactSort) : 'NAME',
    page: parsePage(params.get('page')),
    size: PAGE_SIZE,
  }

  const setFilter: SetFilter = (changes) => {
    // Any filter change goes back to page 1, unless the change *is* a page change
    const next = { ...filter, page: 0, ...changes }
    // Write only non-default values, to keep the URL short
    const search = new URLSearchParams()
    if (next.q) search.set('q', next.q)
    if (next.category) search.set('category', next.category)
    if (next.favorites) search.set('favorites', 'true')
    if (next.sort && next.sort !== 'NAME') search.set('sort', next.sort)
    if (next.page) search.set('page', String(next.page))
    setParams(search, { replace: true })   // replace: don't add a history entry for every click
  }

  return [filter, setFilter]
}

/** /contacts: summary counts, search and filters, then the list itself. */
export function ContactListPage() {
  const [filter, setFilter] = useFilterParams()
  const contacts = useContactList(filter)
  const stats = useContactStats()

  return (
    <>
      <StatsBar stats={stats.data} filter={filter} setFilter={setFilter} />
      <Toolbar filter={filter} setFilter={setFilter} />
      <ContactResults
        query={contacts}
        hasNoContactsAtAll={stats.data?.total === 0}
        onPageChange={(page) => setFilter({ page })}
      />
    </>
  )
}

// ---------------------------------------------------------------- summary counts

interface StatsBarProps {
  stats: ReturnType<typeof useContactStats>['data']   // undefined while loading
  filter: ContactFilter
  setFilter: SetFilter
}

/** The row of counters at the top. Each one is also a button that filters the list. */
function StatsBar({ stats, filter, setFilter }: StatsBarProps) {
  const showingAll = !filter.category && !filter.favorites
  return (
    <section className="stats" aria-label="Summary">
      <StatButton
        value={stats?.total}
        label="All contacts"
        active={showingAll}
        onClick={() => setFilter({ category: undefined, favorites: false })}
      />
      <StatButton
        value={stats?.favorites}
        label="★ Favorites"
        active={!!filter.favorites}
        onClick={() => setFilter({ favorites: !filter.favorites })}
      />
      {CATEGORIES.map((category) => (
        <StatButton
          key={category}
          // A category with no contacts is missing from the server's response, so count it as 0
          value={stats && (stats.byCategory[category] ?? 0)}
          label={CATEGORY_LABELS[category]}
          active={filter.category === category}
          // Clicking the active category again turns the filter off
          onClick={() => setFilter({ category: filter.category === category ? undefined : category })}
        />
      ))}
    </section>
  )
}

function StatButton({ value, label, active, onClick }: {
  value: number | undefined
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button type="button" className={active ? 'stat active' : 'stat'} aria-pressed={active} onClick={onClick}>
      <span className="stat-value">{value ?? '–'}</span>
      <span className="stat-label">{label}</span>
    </button>
  )
}

// ---------------------------------------------------------------- search and filters

function Toolbar({ filter, setFilter }: { filter: ContactFilter & { q: string }; setFilter: SetFilter }) {
  const { isAdmin } = useAuth()

  // What's typed in the search box. It's copied into the URL 300 ms after the user stops typing
  // ("debounce"), so we don't call the server on every key press.
  const [searchText, setSearchText] = useState(filter.q)
  const debouncedSearch = useDebouncedValue(searchText)

  useEffect(() => {
    if (debouncedSearch !== filter.q) setFilter({ q: debouncedSearch })
    // Only react to the (debounced) typing. Also reacting to `filter` would undo Back/Forward navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  // The URL can also change without typing (Back/Forward buttons, a bookmarked link). When it does,
  // show the URL's search text in the box. This is React's recommended way to update state from
  // a changed value during rendering: https://react.dev/learn/you-might-not-need-an-effect
  const [lastUrlSearch, setLastUrlSearch] = useState(filter.q)
  if (filter.q !== lastUrlSearch) {
    setLastUrlSearch(filter.q)
    setSearchText(filter.q)
  }

  return (
    <div className="toolbar">
      <input
        type="search"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
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
        {CATEGORIES.map((category) => <option key={category} value={category}>{CATEGORY_LABELS[category]}</option>)}
      </select>
      <select value={filter.sort} onChange={(e) => setFilter({ sort: e.target.value as ContactSort })} aria-label="Sort">
        {SORTS.map((sort) => <option key={sort} value={sort}>{SORT_LABELS[sort]}</option>)}
      </select>
      <label className="check">
        <input type="checkbox" checked={!!filter.favorites} onChange={(e) => setFilter({ favorites: e.target.checked })} />
        Favorites
      </label>
      {isAdmin && <ExportButton filter={filter} />}
    </div>
  )
}

/** Downloads the current (filtered) list as CSV. Admin-only, like the server endpoint. */
function ExportButton({ filter }: { filter: ContactFilter }) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  const onExport = async () => {
    setBusy(true)
    try {
      // Downloaded with fetch rather than a plain link, because a link can't send the login token
      await contactsApi.exportCsv(filter)
    } catch (error) {
      toast.show(error instanceof Error ? error.message : 'Export failed', 'error')
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

// ---------------------------------------------------------------- the list

interface ContactResultsProps {
  query: ReturnType<typeof useContactList>
  hasNoContactsAtAll: boolean
  onPageChange: (page: number) => void
}

/** Shows whichever applies: loading, an error, "nothing found", or the table with page buttons. */
function ContactResults({ query, hasNoContactsAtAll, onPageChange }: ContactResultsProps) {
  if (query.isPending) return <Spinner label="Loading contacts…" />

  if (query.error) {
    return (
      <ErrorState
        error={query.error}
        action={<button className="btn" type="button" onClick={() => query.refetch()}>Retry</button>}
      />
    )
  }

  const { content: contacts, page } = query.data

  if (contacts.length === 0) {
    return (
      <EmptyState>
        <p>{hasNoContactsAtAll ? 'You have no contacts yet.' : 'No contacts match your filters.'}</p>
        <Link to="/contacts/new" className="btn btn-primary">Add a contact</Link>
      </EmptyState>
    )
  }

  return (
    <>
      {/* aria-busy: while a new page or filter is loading, the old rows stay visible (see useContactList) */}
      <div className="card table-wrap" aria-busy={query.isFetching}>
        <ContactTable contacts={contacts} />
      </div>
      <Pagination
        page={page.number}
        totalPages={page.totalPages}
        totalElements={page.totalElements}
        noun="contacts"
        onChange={onPageChange}
      />
    </>
  )
}

function ContactTable({ contacts }: { contacts: Contact[] }) {
  return (
    <table className="contacts">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Phone</th>
          <th className="hide-sm">Company</th>
          <th className="hide-sm">Category</th>
          <th><span className="visually-hidden">Actions</span></th>
        </tr>
      </thead>
      <tbody>
        {contacts.map((contact) => (
          // `key` lets React tell the rows apart when the list changes
          <tr key={contact.id}>
            <td>
              <Link className="person" to={`/contacts/${contact.id}`}>
                <Avatar contact={contact} />
                <span>
                  <strong>{contact.fullName}</strong>
                  {contact.jobTitle && <small>{contact.jobTitle}</small>}
                </span>
              </Link>
            </td>
            <td>{contact.email ? <a href={`mailto:${contact.email}`}>{contact.email}</a> : <Dash />}</td>
            <td>{contact.phone ? <a href={`tel:${contact.phone}`}>{contact.phone}</a> : <Dash />}</td>
            <td className="hide-sm">{contact.company ?? <Dash />}</td>
            <td className="hide-sm"><CategoryTag category={contact.category} /></td>
            <td className="actions">
              <FavoriteButton contact={contact} />
              <Link
                className="icon-btn"
                to={`/contacts/${contact.id}/edit`}
                title="Edit"
                aria-label={`Edit ${contact.fullName}`}
              >
                ✎
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** Placeholder for an empty cell. */
function Dash() {
  return <span className="muted">—</span>
}
