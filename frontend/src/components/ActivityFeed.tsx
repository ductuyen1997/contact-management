import { Link } from 'react-router'
import type { ActivityType } from '../api/types'
import { useActivities } from '../hooks/useActivities'
import { ACTIVITY_LABELS } from '../lib/contact'
import { formatDateTime, timeAgo } from '../lib/format'
import { Pagination } from './Pagination'
import { Spinner } from './States'

const ICONS: Record<ActivityType, string> = {
  CREATED: '＋',
  UPDATED: '✎',
  DELETED: '✕',
  FAVORITED: '★',
  UNFAVORITED: '☆',
}

interface Props {
  contactId?: number
  page?: number
  size?: number
  onPageChange?: (page: number) => void
}

export function ActivityFeed({ contactId, page = 0, size = 20, onPageChange }: Props) {
  const { data, isPending, error } = useActivities({ contactId, page, size })

  if (isPending) return <Spinner label="Loading activity…" />
  if (error) {
    return <p className="muted">Activity history is unavailable right now ({error.message}).</p>
  }
  if (data.content.length === 0) return <p className="muted">No activity yet.</p>

  return (
    <>
      <ol className="feed">
        {data.content.map((a) => (
          <li key={a.id} className={`feed-item feed-${a.type.toLowerCase()}`}>
            <span className="feed-icon" aria-hidden="true">{ICONS[a.type]}</span>
            <span className="feed-text">
              {contactId === undefined && a.type !== 'DELETED' ? (
                <Link to={`/contacts/${a.contactId}`}>{a.contactName}</Link>
              ) : (
                <strong>{a.contactName}</strong>
              )}{' '}
              {ACTIVITY_LABELS[a.type]}
            </span>
            <time className="muted" dateTime={a.occurredAt} title={formatDateTime(a.occurredAt)}>
              {timeAgo(a.occurredAt)}
            </time>
          </li>
        ))}
      </ol>
      {onPageChange && (
        <Pagination
          page={data.page.number}
          totalPages={data.page.totalPages}
          totalElements={data.page.totalElements}
          noun="events"
          onChange={onPageChange}
        />
      )}
    </>
  )
}
