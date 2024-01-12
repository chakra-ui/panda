import { describe, expect, test } from 'vitest'
import { stringify } from '../src/stringify'

describe('stringify', () => {
  test('should convert', () => {
    expect(stringify({ whiteSpace: 'nowrap' })).toMatchInlineSnapshot(`
      "white-space: nowrap;
      "
    `)

    expect(stringify({ '--welcome-x': '20' })).toMatchInlineSnapshot(`
      "--welcome-x: 20;
      "
    `)
  })
})
