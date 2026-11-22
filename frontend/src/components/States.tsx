import type { ReactNode } from 'react'

// Shared building blocks for the three "no data to show yet" situations: loading, failed, empty.

/** Loading indicator. role="status" makes screen readers announce the label. */
export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return <div className="state muted" role="status"><span className="spinner" /> {label}</div>
}

/** An error message, with an optional button such as "Retry". */
export function ErrorState({ error, action }: { error: Error; action?: ReactNode }) {
  return (
    <div className="state error-box" role="alert">
      <p>{error.message}</p>
      {action}
    </div>
  )
}

/** A centred box for "nothing here" messages; `children` is whatever is placed inside the tags. */
export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>
}
