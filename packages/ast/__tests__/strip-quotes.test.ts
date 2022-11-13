import { describe, test, expect } from 'vitest'
import { stripQuotes } from '../src/strip-quotes'

describe('strip quotes', () => {
  test('should work', () => {
    expect(stripQuotes('"&:active"')).toBe('&:active')
  })
})
