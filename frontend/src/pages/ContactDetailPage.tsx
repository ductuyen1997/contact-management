import { Link, useNavigate, useParams } from 'react-router'
import { ActivityFeed } from '../components/ActivityFeed'
import { Avatar } from '../components/Avatar'
import { CategoryTag } from '../components/CategoryTag'
import { FavoriteButton } from '../components/FavoriteButton'
import { ErrorState, Spinner } from '../components/States'
import { useContact, useDeleteContact } from '../hooks/useContacts'
import { useToast } from '../hooks/useToast'
import { ApiError } from '../api/http'
import { headline } from '../lib/contact'
import { formatDateTime } from '../lib/format'
import { NotFoundPage } from './NotFoundPage'

export function ContactDetailPage() {
  const id = Number(useParams().id)
  const { data: contact, isPending, error } = useContact(id)
  const remove = useDeleteContact()
  const navigate = useNavigate()
  const toast = useToast()

  if (isPending) return <Spinner />
  if (error instanceof ApiError && error.status === 404) return <NotFoundPage />
  if (error) return <ErrorState error={error} />

  const onDelete = () => {
    if (!window.confirm(`Delete ${contact.fullName}? This cannot be undone.`)) return
    remove.mutate(contact.id, {
      onSuccess: () => {
        toast.show(`${contact.fullName} was deleted.`)
        navigate('/contacts')
      },
      onError: (e) => toast.show(e.message, 'error'),
    })
  }

  const title = headline(contact)

  return (
    <div className="narrow">
      <Link className="back" to="/contacts">‹ All contacts</Link>

      <article className="card profile">
        <div className="profile-head">
          <Avatar contact={contact} large />
          <div className="profile-title">
            <h1>{contact.fullName}</h1>
            {title && <p className="muted">{title}</p>}
            <CategoryTag category={contact.category} />
          </div>
          <FavoriteButton contact={contact} large />
        </div>

        <dl className="details">
          <dt>Email</dt>
          <dd>{contact.email ? <a href={`mailto:${contact.email}`}>{contact.email}</a> : <span className="muted">—</span>}</dd>
          <dt>Phone</dt>
          <dd>{contact.phone ? <a href={`tel:${contact.phone}`}>{contact.phone}</a> : <span className="muted">—</span>}</dd>
          <dt>Company</dt>
          <dd>{contact.company ?? '—'}</dd>
          <dt>Address</dt>
          <dd>{contact.address ?? '—'}</dd>
          <dt>Notes</dt>
          <dd className="notes">{contact.notes ?? '—'}</dd>
        </dl>

        <p className="meta muted">
          Added {formatDateTime(contact.createdAt)} · Updated {formatDateTime(contact.updatedAt)}
        </p>

        <div className="form-actions">
          <button className="btn btn-danger push-left" onClick={onDelete} disabled={remove.isPending}>Delete</button>
          <Link className="btn btn-primary" to={`/contacts/${contact.id}/edit`}>Edit contact</Link>
        </div>
      </article>

      <section className="card section">
        <h2>History</h2>
        <ActivityFeed contactId={contact.id} size={10} />
      </section>
    </div>
  )
}
