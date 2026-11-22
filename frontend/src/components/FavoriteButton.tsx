import type { Contact } from '../api/types'
import { useToggleFavorite } from '../hooks/useContacts'
import { useToast } from '../hooks/useToast'

/** The ★ / ☆ button. Clicking it saves the change on the server right away. */
export function FavoriteButton({ contact, large = false }: { contact: Contact; large?: boolean }) {
  const toggle = useToggleFavorite()
  const toast = useToast()
  const label = contact.favorite ? 'Remove from favorites' : 'Add to favorites'
  const className = ['icon-btn', 'star', contact.favorite && 'on', large && 'big'].filter(Boolean).join(' ')

  return (
    <button
      type="button"
      className={className}
      title={label}
      aria-label={label}
      aria-pressed={contact.favorite}   // tells screen readers this is an on/off button, and its state
      disabled={toggle.isPending}       // no double clicks while the request is running
      onClick={() => toggle.mutate(contact.id, { onError: (e) => toast.show(e.message, 'error') })}
    >
      {contact.favorite ? '★' : '☆'}
    </button>
  )
}
