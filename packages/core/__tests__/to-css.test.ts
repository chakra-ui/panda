import { describe, expect, test } from 'vitest'
import { toCss } from '../src/to-css'

describe('to-css', () => {
  test('should convert', () => {
    expect(toCss({ whiteSpace: 'nowrap' })).toMatchInlineSnapshot(`
      "white-space: nowrap;
      "
    `)
    expect(toCss({ '--welcome-x': '20' })).toMatchInlineSnapshot(`
      "--welcome-x: 20;
      "
    `)
  })
})
