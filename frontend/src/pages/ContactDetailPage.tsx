import type { ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ApiError } from '../api/http'
import type { Contact } from '../api/types'
import { ActivityFeed } from '../components/ActivityFeed'
import { Avatar } from '../components/Avatar'
import { CategoryTag } from '../components/CategoryTag'
import { FavoriteButton } from '../components/FavoriteButton'
import { ErrorState, Spinner } from '../components/States'
import { useAuth } from '../hooks/useAuth'
import { useContact, useDeleteContact } from '../hooks/useContacts'
import { useToast } from '../hooks/useToast'
import { headline } from '../lib/contact'
import { formatDateTime } from '../lib/format'
import { parseId } from '../lib/params'
import { NotFoundPage } from './NotFoundPage'

/** /contacts/:id — one contact's details and change history. */
export function ContactDetailPage() {
  const id = parseId(useParams().id)
  if (id === undefined) return <NotFoundPage />   // e.g. /contacts/abc
  return <ContactDetail id={id} />
}

function ContactDetail({ id }: { id: number }) {
  const { data: contact, isPending, error } = useContact(id)

  if (isPending) return <Spinner />
  if (error instanceof ApiError && error.status === 404) return <NotFoundPage />
  if (error) return <ErrorState error={error} />

  const subtitle = headline(contact)   // e.g. "Manager at Acme"

  return (
    <div className="narrow">
      <Link className="back" to="/contacts">‹ All contacts</Link>

      <article className="card profile">
        <div className="profile-head">
          <Avatar contact={contact} large />
          <div className="profile-title">
            <h1>{contact.fullName}</h1>
            {subtitle && <p className="muted">{subtitle}</p>}
            <CategoryTag category={contact.category} />
          </div>
          <FavoriteButton contact={contact} large />
        </div>

        <dl className="details">
          <Detail label="Email">
            {contact.email && <a href={`mailto:${contact.email}`}>{contact.email}</a>}
          </Detail>
          <Detail label="Phone">
            {contact.phone && <a href={`tel:${contact.phone}`}>{contact.phone}</a>}
          </Detail>
          <Detail label="Company">{contact.company}</Detail>
          <Detail label="Address">{contact.address}</Detail>
          <Detail label="Notes" className="notes">{contact.notes}</Detail>
        </dl>

        <p className="meta muted">
          Added {contact.createdBy && <>by <strong>{contact.createdBy}</strong> </>}
          on {formatDateTime(contact.createdAt)} · Updated {formatDateTime(contact.updatedAt)}
        </p>

        <div className="form-actions">
          <DeleteButton contact={contact} />
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

/** One "label: value" row of the details list. Shows a dash when the value is empty. */
function Detail({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <>
      <dt>{label}</dt>
      <dd className={className}>{children || <span className="muted">—</span>}</dd>
    </>
  )
}

/** Asks for confirmation, deletes, then returns to the list. Only admins see it (the server enforces the same rule). */
function DeleteButton({ contact }: { contact: Contact }) {
  const { isAdmin } = useAuth()
  const remove = useDeleteContact()
  const navigate = useNavigate()
  const toast = useToast()

  if (!isAdmin) return null

  const onDelete = () => {
    if (!window.confirm(`Delete ${contact.fullName}? This cannot be undone.`)) return
    remove.mutate(contact.id, {
      onSuccess: () => {
        toast.show(`${contact.fullName} was deleted.`)
        navigate('/contacts')
      },
      onError: (error) => toast.show(error.message, 'error'),
    })
  }

  return (
    <button className="btn btn-danger push-left" type="button" onClick={onDelete} disabled={remove.isPending}>
      Delete
    </button>
  )
}
