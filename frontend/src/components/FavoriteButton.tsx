import type { Contact } from '../api/types'
import { useToggleFavorite } from '../hooks/useContacts'
import { useToast } from '../hooks/useToast'

export function FavoriteButton({ contact, large = false }: { contact: Contact; large?: boolean }) {
  const toggle = useToggleFavorite()
  const toast = useToast()
  const label = contact.favorite ? 'Remove from favorites' : 'Add to favorites'

  return (
    <button
      type="button"
      className={`icon-btn star${contact.favorite ? ' on' : ''}${large ? ' big' : ''}`}
      title={label}
      aria-label={label}
      aria-pressed={contact.favorite}
      disabled={toggle.isPending}
      onClick={() => toggle.mutate(contact.id, { onError: (e) => toast.show(e.message, 'error') })}
    >
      {contact.favorite ? '★' : '☆'}
    </button>
  )
}
