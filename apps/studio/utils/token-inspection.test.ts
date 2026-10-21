import { describe, expect, it } from 'vitest'
import { byteToCharIndex, isRawValue, nearestTokenName } from './token-inspection'

describe('nearestTokenName', () => {
  const names = ['fg', 'fg.muted', 'fg.subtle', 'bg.surface', 'accent.solid']

  it('suggests the token a typo was meant to be', () => {
    expect(nearestTokenName('fg.mutd', names)).toBe('fg.muted')
    expect(nearestTokenName('acent.solid', names)).toBe('accent.solid')
  })

  it('suggests nothing when no name is close', () => {
    expect(nearestTokenName('brand.primary', names)).toBeUndefined()
  })
})

describe('byteToCharIndex', () => {
  it('passes ASCII offsets through', () => {
    const toChar = byteToCharIndex(`css({ color: 'fg' })`)
    expect(toChar(14)).toBe(14)
  })

  it('maps byte offsets after multi-byte characters to character positions', () => {
    const source = `// café\ncss({ color: 'fg' })`
    const byte = new TextEncoder().encode(source.slice(0, source.indexOf('fg'))).length
    expect(byteToCharIndex(source)(byte)).toBe(source.indexOf('fg'))
  })

  it('handles characters outside the basic plane', () => {
    const source = `// 🐼\ncss({ p: '4' })`
    const byte = new TextEncoder().encode(source.slice(0, source.indexOf("'4'"))).length
    expect(byteToCharIndex(source)(byte)).toBe(source.indexOf("'4'"))
  })
})

describe('isRawValue', () => {
  it('counts a percentage on a Panda-only utility as hard-coded, not an unknown token', () => {
    expect(isRawValue('maskBottomFrom', '40%')).toBe(true)
  })

  it('still flags a misspelled token name on a Panda-only utility', () => {
    expect(isRawValue('maskBottomFrom', 'fg.mutd')).toBe(false)
  })
})
