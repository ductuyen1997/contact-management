import { describe, expect, it } from 'vitest'
import { avatarHue, headline, initials } from './contact'

describe('contact helpers', () => {
  it('builds initials from first and last name', () => {
    expect(initials({ firstName: 'alice', lastName: 'Nguyen' })).toBe('AN')
    expect(initials({ firstName: 'Ivan', lastName: null })).toBe('I')
  })

  it('derives a stable hue in range', () => {
    const hue = avatarHue('Alice Nguyen')
    expect(hue).toBe(avatarHue('Alice Nguyen'))
    expect(hue).toBeGreaterThanOrEqual(0)
    expect(hue).toBeLessThan(360)
  })

  it('combines job title and company', () => {
    expect(headline({ jobTitle: 'CTO', company: 'Stark' })).toBe('CTO at Stark')
    expect(headline({ jobTitle: null, company: 'Stark' })).toBe('Stark')
    expect(headline({ jobTitle: null, company: null })).toBeNull()
  })
})
