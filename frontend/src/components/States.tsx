import type { ReactNode } from 'react'

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return <div className="state muted" role="status"><span className="spinner" /> {label}</div>
}

export function ErrorState({ error, action }: { error: Error; action?: ReactNode }) {
  return (
    <div className="state error-box" role="alert">
      <p>{error.message}</p>
      {action}
    </div>
  )
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>
}
