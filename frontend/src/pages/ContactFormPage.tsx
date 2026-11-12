import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, type InputHTMLAttributes } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router'
import { ApiError } from '../api/http'
import { CATEGORIES, type Contact } from '../api/types'
import { ErrorState, Spinner } from '../components/States'
import { useContact, useSaveContact } from '../hooks/useContacts'
import { useToast } from '../hooks/useToast'
import { CATEGORY_LABELS } from '../lib/contact'
import { contactSchema, EMPTY_CONTACT, type ContactFormValues } from '../lib/contactSchema'
import { NotFoundPage } from './NotFoundPage'

function toFormValues(c: Contact): ContactFormValues {
  return {
    firstName: c.firstName,
    lastName: c.lastName ?? '',
    email: c.email ?? '',
    phone: c.phone ?? '',
    company: c.company ?? '',
    jobTitle: c.jobTitle ?? '',
    address: c.address ?? '',
    notes: c.notes ?? '',
    category: c.category,
    favorite: c.favorite,
  }
}

export function ContactFormPage() {
  const params = useParams()
  const id = params.id ? Number(params.id) : undefined
  return id ? <EditContact id={id} /> : <ContactForm />
}

function EditContact({ id }: { id: number }) {
  const { data, isPending, error } = useContact(id)
  if (isPending) return <Spinner />
  if (error instanceof ApiError && error.status === 404) return <NotFoundPage />
  if (error) return <ErrorState error={error} />
  return <ContactForm contact={data} />
}

const FIELD_NAMES = Object.keys(EMPTY_CONTACT) as (keyof ContactFormValues)[]

export function ContactForm({ contact }: { contact?: Contact }) {
  const isEdit = contact !== undefined
  const save = useSaveContact(contact?.id)
  const navigate = useNavigate()
  const toast = useToast()
  const backTo = isEdit ? `/contacts/${contact.id}` : '/contacts'

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: contact ? toFormValues(contact) : EMPTY_CONTACT,
  })

  useEffect(() => {
    if (contact) reset(toFormValues(contact))
  }, [contact, reset])

  const onSubmit = async (values: ContactFormValues) => {
    try {
      const saved = await save.mutateAsync(values)
      toast.show(`${saved.fullName} was ${isEdit ? 'updated' : 'added'}.`)
      navigate(`/contacts/${saved.id}`)
    } catch (e) {
      if (e instanceof ApiError && Object.keys(e.fieldErrors).length > 0) {
        // Map server-side validation (e.g. duplicate e-mail) back onto the form fields
        let focused = false
        for (const [field, message] of Object.entries(e.fieldErrors)) {
          if (!FIELD_NAMES.includes(field as keyof ContactFormValues)) continue
          setError(field as keyof ContactFormValues, { type: 'server', message })
          if (!focused) {
            setFocus(field as keyof ContactFormValues)
            focused = true
          }
        }
      } else {
        setError('root', { message: e instanceof Error ? e.message : 'Something went wrong' })
      }
    }
  }

  const field = (name: keyof ContactFormValues, label: string, props: InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input id={name} className={errors[name] ? 'invalid' : undefined} aria-invalid={!!errors[name]} {...props} {...register(name)} />
      {errors[name] && <p className="error">{errors[name]?.message}</p>}
    </div>
  )

  return (
    <div className="narrow">
      <Link className="back" to={backTo}>‹ Back</Link>
      <h1>{isEdit ? 'Edit contact' : 'New contact'}</h1>

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
              {CATEGORIES.map((cat) => <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>)}
            </select>
          </div>
          <div className="field field-check">
            <label className="check"><input type="checkbox" {...register('favorite')} /> Mark as favorite ★</label>
          </div>
        </div>

        <div className="field">
          <label htmlFor="notes">Notes</label>
          <textarea id="notes" rows={4} className={errors.notes ? 'invalid' : undefined} {...register('notes')} />
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
