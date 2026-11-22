import { zodResolver } from '@hookform/resolvers/zod'
import type { InputHTMLAttributes } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router'
import { ApiError } from '../api/http'
import { CATEGORIES, type Contact } from '../api/types'
import { ErrorState, Spinner } from '../components/States'
import { useContact, useSaveContact } from '../hooks/useContacts'
import { useToast } from '../hooks/useToast'
import { CATEGORY_LABELS } from '../lib/contact'
import { contactSchema, EMPTY_CONTACT, type ContactFormValues } from '../lib/contactSchema'
import { showSubmitError } from '../lib/formErrors'
import { parseId } from '../lib/params'
import { NotFoundPage } from './NotFoundPage'

/**
 * One page for two routes:
 * - /contacts/new       → an empty form that creates a contact
 * - /contacts/:id/edit  → loads the contact, then shows the same form filled in
 */
export function ContactFormPage() {
  const { id } = useParams()   // "42" for /contacts/42/edit, undefined for /contacts/new

  if (id === undefined) return <ContactForm />

  const contactId = parseId(id)
  if (contactId === undefined) return <NotFoundPage />   // e.g. /contacts/abc/edit
  return <EditContact id={contactId} />
}

/** Loads the contact first, so the form can start with its current values. */
function EditContact({ id }: { id: number }) {
  const { data: contact, isPending, error } = useContact(id)

  if (isPending) return <Spinner />
  if (error instanceof ApiError && error.status === 404) return <NotFoundPage />
  if (error) return <ErrorState error={error} />

  // `key`: if this page is ever reused for a different contact, start a fresh form for it.
  // The form copies the contact's values only once, when it first appears, so a background
  // refresh of the contact never wipes out changes the user is still typing.
  return <ContactForm key={contact.id} contact={contact} />
}

/** The API returns `null` for empty fields; the form's inputs need empty strings instead. */
function toFormValues(contact: Contact): ContactFormValues {
  return {
    firstName: contact.firstName,
    lastName: contact.lastName ?? '',
    email: contact.email ?? '',
    phone: contact.phone ?? '',
    company: contact.company ?? '',
    jobTitle: contact.jobTitle ?? '',
    address: contact.address ?? '',
    notes: contact.notes ?? '',
    category: contact.category,
    favorite: contact.favorite,
  }
}

/** The form's inputs in on-screen order (used to place server errors under the right input). */
const FIELDS = [
  'firstName', 'lastName', 'email', 'phone', 'company', 'jobTitle', 'address', 'category', 'favorite', 'notes',
] as const satisfies readonly (keyof ContactFormValues)[]

/** Creates a contact, or edits `contact` when one is given. */
export function ContactForm({ contact }: { contact?: Contact }) {
  const isEdit = contact !== undefined
  const save = useSaveContact(contact?.id)
  const navigate = useNavigate()
  const toast = useToast()
  const backTo = isEdit ? `/contacts/${contact.id}` : '/contacts'

  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),   // check the values against the rules in lib/contactSchema.ts
    defaultValues: isEdit ? toFormValues(contact) : EMPTY_CONTACT,
  })

  // Only called when the values pass the rules (handleSubmit checks them first).
  const onSubmit = async (values: ContactFormValues) => {
    try {
      const saved = await save.mutateAsync(values)
      toast.show(`${saved.fullName} was ${isEdit ? 'updated' : 'added'}.`)
      navigate(`/contacts/${saved.id}`)
    } catch (error) {
      // e.g. the server says the email is already used by another contact
      const firstInvalid = showSubmitError(error, FIELDS, setError)
      if (firstInvalid) setFocus(firstInvalid)
    }
  }

  /** One labelled text input, with its error message underneath. `props` adds extras such as type="email". */
  const field = (name: keyof ContactFormValues, label: string, props: InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        className={errors[name] ? 'invalid' : undefined}
        aria-invalid={!!errors[name]}
        {...props}
        {...register(name)}   // connects the input to the form: adds name, onChange, onBlur and ref
      />
      {errors[name] && <p className="error">{errors[name]?.message}</p>}
    </div>
  )

  return (
    <div className="narrow">
      <Link className="back" to={backTo}>‹ Back</Link>
      <h1>{isEdit ? 'Edit contact' : 'New contact'}</h1>

      {/* noValidate: skip the browser's own validation popups; the schema shows nicer messages */}
      <form className="card form" onSubmit={handleSubmit(onSubmit)} noValidate>
        {errors.root && <div className="error-box" role="alert">{errors.root.message}</div>}

        <div className="grid-2">
          {field('firstName', 'First name *', { autoFocus: true })}
          {field('lastName', 'Last name')}
          {field('email', 'Email', { type: 'email' })}
          {field('phone', 'Phone', { type: 'tel' })}
          {field('company', 'Company')}
          {field('jobTitle', 'Job title')}
        </div>

        {field('address', 'Address')}

        <div className="grid-2">
          <div className="field">
            <label htmlFor="category">Category *</label>
            <select id="category" {...register('category')}>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>{CATEGORY_LABELS[category]}</option>
              ))}
            </select>
          </div>
          <div className="field field-check">
            <label className="check"><input type="checkbox" {...register('favorite')} /> Mark as favorite ★</label>
          </div>
        </div>

        <div className="field">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            rows={4}
            className={errors.notes ? 'invalid' : undefined}
            aria-invalid={!!errors.notes}
            {...register('notes')}
          />
          {errors.notes && <p className="error">{errors.notes.message}</p>}
        </div>

        <div className="form-actions">
          <Link className="btn btn-ghost" to={backTo}>Cancel</Link>
          <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create contact'}
          </button>
        </div>
      </form>
    </div>
  )
}
