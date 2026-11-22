import type { CSSProperties } from 'react'
import type { Contact } from '../api/types'
import { avatarHue, initials } from '../lib/contact'

interface Props {
  contact: Pick<Contact, 'firstName' | 'lastName' | 'fullName'>
  large?: boolean
}

/** A coloured circle with the contact's initials. The colour comes from the name, so it never changes. */
export function Avatar({ contact, large = false }: Props) {
  return (
    <span
      className={large ? 'avatar avatar-lg' : 'avatar'}
      // Sets the CSS variable --hue, which index.css uses for the colour. TypeScript's style type
      // doesn't know about custom "--" variables, hence the cast.
      style={{ '--hue': avatarHue(contact.fullName) } as CSSProperties}
      aria-hidden="true"   // decoration only: screen readers read the name next to it instead
    >
      {initials(contact)}
    </span>
  )
}
