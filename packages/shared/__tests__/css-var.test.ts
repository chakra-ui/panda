import { describe, expect, test } from 'vitest'
import { cssVar } from '../src'

describe('css var', () => {
  test('basic', () => {
    expect(cssVar('-2.4', { prefix: 'vc-spacing' })).toMatchInlineSnapshot(`
        {
          "ref": "var(--vc-spacing--2\\\\.4)",
          "var": "--vc-spacing--2\\\\.4",
        }
      `)
  })
})
