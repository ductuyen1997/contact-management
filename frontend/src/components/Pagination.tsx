interface Props {
  page: number
  totalPages: number
  totalElements: number
  noun?: string
  onChange: (page: number) => void
}

export function Pagination({ page, totalPages, totalElements, noun = 'items', onChange }: Props) {
  if (totalPages <= 1) return null
  return (
    <nav className="pager" aria-label="Pagination">
      <button className="btn" disabled={page === 0} onClick={() => onChange(page - 1)}>‹ Prev</button>
      <span>Page {page + 1} of {totalPages} · {totalElements} {noun}</span>
      <button className="btn" disabled={page + 1 >= totalPages} onClick={() => onChange(page + 1)}>Next ›</button>
    </nav>
  )
}
