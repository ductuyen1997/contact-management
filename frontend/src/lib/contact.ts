import type { ActivityType, Category, Contact, ContactSort } from '../api/types'

export const CATEGORY_LABELS: Record<Category, string> = {
  FAMILY: 'Family',
  FRIEND: 'Friend',
  WORK: 'Work',
  CLIENT: 'Client',
  OTHER: 'Other',
}

export const SORT_LABELS: Record<ContactSort, string> = {
  NAME: 'Name A–Z',
  NAME_DESC: 'Name Z–A',
  COMPANY: 'Company',
  NEWEST: 'Recently added',
  UPDATED: 'Recently updated',
}

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  CREATED: 'was added',
  UPDATED: 'was updated',
  DELETED: 'was deleted',
  FAVORITED: 'was added to favorites',
  UNFAVORITED: 'was removed from favorites',
}

export function initials(contact: Pick<Contact, 'firstName' | 'lastName'>): string {
  return [contact.firstName, contact.lastName]
    .map((part) => part?.trim().charAt(0) ?? '')
    .join('')
    .toUpperCase()
}

/** Stable hue (0–359) derived from the name, used for the avatar colour. */
export function avatarHue(name: string): number {
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return ((hash % 360) + 360) % 360
}

export function headline(contact: Pick<Contact, 'jobTitle' | 'company'>): string | null {
  if (contact.jobTitle && contact.company) return `${contact.jobTitle} at ${contact.company}`
  return contact.jobTitle || contact.company || null
}
