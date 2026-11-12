import { describe, expect, it } from 'vitest'
import { contactSchema, EMPTY_CONTACT } from './contactSchema'

describe('contactSchema', () => {
  it('accepts a minimal contact and trims input', () => {
    const result = contactSchema.parse({ ...EMPTY_CONTACT, firstName: '  Jane ' })
    expect(result.firstName).toBe('Jane')
  })

  it('reports field errors matching the backend rules', () => {
    const result = contactSchema.safeParse({ ...EMPTY_CONTACT, firstName: ' ', email: 'nope', phone: 'abc' })
    expect(result.success).toBe(false)
    const fields = result.error!.issues.map((i) => i.path[0])
    expect(fields).toEqual(expect.arrayContaining(['firstName', 'email', 'phone']))
  })

  it('allows empty optional email and phone', () => {
    expect(contactSchema.safeParse({ ...EMPTY_CONTACT, firstName: 'A' }).success).toBe(true)
  })
})
