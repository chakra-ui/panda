import { describe, expect, test } from 'vitest'
import { token } from '../styled-system/tokens'

describe('token fn', () => {
  test('token', () => {
    expect(token('colors.red.300')).toMatchInlineSnapshot(`"#fca5a5"`)
  })

  test('token.var', () => {
    expect(token.var('colors.red.300')).toMatchInlineSnapshot(`"var(--colors-red-300)"`)
  })
})
