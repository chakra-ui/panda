import { describe, expect, test } from 'vitest'
import { toCss } from '../src/to-css'

describe('to-css', () => {
  test('should convert', () => {
    expect(toCss({ whiteSpace: 'nowrap' }).css).toMatchInlineSnapshot('"white-space: nowrap"')
    expect(toCss({ '--welcome-x': '20' }).css).toMatchInlineSnapshot('"--welcome-x: 20"')
  })
})
