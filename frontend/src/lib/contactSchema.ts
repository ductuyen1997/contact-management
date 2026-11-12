import { z } from 'zod'
import { CATEGORIES } from '../api/types'

// Mirrors the Bean Validation rules on ContactForm in contact-service, so users get instant
// feedback; the server remains the source of truth (e.g. duplicate e-mail checks).
const text = (label: string, max: number) =>
  z.string().trim().max(max, `${label} must be at most ${max} characters`)

export const contactSchema = z.object({
  firstName: text('First name', 60).min(1, 'First name is required'),
  lastName: text('Last name', 60),
  email: text('Email', 120).refine((v) => v === '' || z.email().safeParse(v).success, {
    message: 'Please enter a valid email address',
  }),
  phone: z
    .string()
    .trim()
    .regex(/^$|^[+0-9 ()\-.]{6,25}$/, 'Please enter a valid phone number'),
  company: text('Company', 100),
  jobTitle: text('Job title', 100),
  address: text('Address', 255),
  notes: text('Notes', 2000),
  category: z.enum(CATEGORIES),
  favorite: z.boolean(),
})

export type ContactFormValues = z.infer<typeof contactSchema>

export const EMPTY_CONTACT: ContactFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  company: '',
  jobTitle: '',
  address: '',
  notes: '',
  category: 'OTHER',
  favorite: false,
}
