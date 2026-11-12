import type { CSSProperties } from 'react'
import type { Contact } from '../api/types'
import { avatarHue, initials } from '../lib/contact'

interface Props {
  contact: Pick<Contact, 'firstName' | 'lastName' | 'fullName'>
  large?: boolean
}

export function Avatar({ contact, large = false }: Props) {
  return (
    <span
      className={large ? 'avatar avatar-lg' : 'avatar'}
      style={{ '--hue': avatarHue(contact.fullName) } as CSSProperties}
      aria-hidden="true"
    >
      {initials(contact)}
    </span>
  )
}
