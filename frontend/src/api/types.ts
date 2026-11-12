export const CATEGORIES = ['FAMILY', 'FRIEND', 'WORK', 'CLIENT', 'OTHER'] as const
export type Category = (typeof CATEGORIES)[number]

export const SORTS = ['NAME', 'NAME_DESC', 'COMPANY', 'NEWEST', 'UPDATED'] as const
export type ContactSort = (typeof SORTS)[number]

export interface Contact {
  id: number
  firstName: string
  lastName: string | null
  fullName: string
  email: string | null
  phone: string | null
  company: string | null
  jobTitle: string | null
  address: string | null
  notes: string | null
  category: Category
  favorite: boolean
  createdAt: string
  updatedAt: string
}

/** Request body for create / update (POST, PUT). */
export interface ContactInput {
  firstName: string
  lastName: string
  email: string
  phone: string
  company: string
  jobTitle: string
  address: string
  notes: string
  category: Category
  favorite: boolean
}

export interface ContactFilter {
  q?: string
  category?: Category
  favorites?: boolean
  sort?: ContactSort
  page?: number
  size?: number
}

export interface ContactStats {
  total: number
  favorites: number
  byCategory: Partial<Record<Category, number>>
}

export const ACTIVITY_TYPES = ['CREATED', 'UPDATED', 'DELETED', 'FAVORITED', 'UNFAVORITED'] as const
export type ActivityType = (typeof ACTIVITY_TYPES)[number]

export interface Activity {
  id: number
  type: ActivityType
  contactId: number
  contactName: string
  occurredAt: string
}

/** Spring Data `PagedModel` JSON shape. */
export interface Page<T> {
  content: T[]
  page: {
    size: number
    number: number
    totalElements: number
    totalPages: number
  }
}
