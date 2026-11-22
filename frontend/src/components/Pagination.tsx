interface Props {
  /** Current page, zero-based (0 = first page), like the server's Spring Data pages. */
  page: number
  totalPages: number
  totalElements: number
  /** What is being counted, e.g. "contacts" → "Page 1 of 3 · 25 contacts". */
  noun?: string
  onChange: (page: number) => void
}

/** "‹ Prev  Page 1 of 3 · 25 contacts  Next ›". Hidden when everything fits on one page. */
export function Pagination({ page, totalPages, totalElements, noun = 'items', onChange }: Props) {
  if (totalPages <= 1) return null

  const isFirst = page === 0
  const isLast = page + 1 >= totalPages

  return (
    <nav className="pager" aria-label="Pagination">
      <button className="btn" type="button" disabled={isFirst} onClick={() => onChange(page - 1)}>‹ Prev</button>
      <span>Page {page + 1} of {totalPages} · {totalElements} {noun}</span>
      <button className="btn" type="button" disabled={isLast} onClick={() => onChange(page + 1)}>Next ›</button>
    </nav>
  )
}
