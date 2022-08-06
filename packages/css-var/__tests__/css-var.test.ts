import { describe, expect, test } from 'vitest'
import { createVar } from '../src'

describe('css var', () => {
  test('basic', () => {
    expect(createVar('-2.4', { prefix: 'vc-spacing' })).toMatchInlineSnapshot(`
        {
          "ref": "var(--vc-spacing--2\\\\.4)",
          "var": "--vc-spacing--2\\\\.4",
        }
      `)
  })
})
