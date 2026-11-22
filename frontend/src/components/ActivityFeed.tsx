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
  /** Show only this contact's history. Leave it out to show every contact's changes. */
  contactId?: number
  /** Zero-based page number. */
  page?: number
  size?: number
  /** When given, page buttons are shown under the list. */
  onPageChange?: (page: number) => void
}

/**
 * A list of changes ("Alice Nguyen was updated · 5 minutes ago"), read from activity-service.
 * Used on the Activity page (all contacts) and on each contact's page (that contact only).
 */
export function ActivityFeed({ contactId, page = 0, size = 20, onPageChange }: Props) {
  const { data, isPending, error } = useActivities({ contactId, page, size })

  if (isPending) return <Spinner label="Loading activity…" />
  if (error) {
    // Only this box shows the error, so the rest of the page still works if activity-service is down
    return <p className="muted">Activity history is unavailable right now ({error.message}).</p>
  }
  if (data.content.length === 0) return <p className="muted">No activity yet.</p>

  // Link names to the contact's page, except on that contact's own page, and for "was deleted"
  // entries (the contact no longer exists)
  const linkNames = contactId === undefined

  return (
    <>
      <ol className="feed">
        {data.content.map((activity) => (
          <li key={activity.id} className={`feed-item feed-${activity.type.toLowerCase()}`}>
            <span className="feed-icon" aria-hidden="true">{ICONS[activity.type]}</span>
            <span className="feed-text">
              {linkNames && activity.type !== 'DELETED' ? (
                <Link to={`/contacts/${activity.contactId}`}>{activity.contactName}</Link>
              ) : (
                <strong>{activity.contactName}</strong>
              )}{' '}
              {ACTIVITY_LABELS[activity.type]}
            </span>
            {/* Shows "5 minutes ago"; hovering shows the exact date and time */}
            <time className="muted" dateTime={activity.occurredAt} title={formatDateTime(activity.occurredAt)}>
              {timeAgo(activity.occurredAt)}
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
