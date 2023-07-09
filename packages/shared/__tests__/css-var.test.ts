import { describe, expect, test } from 'vitest'
import { cssVar } from '../src'

describe('css var', () => {
  test('with negative', () => {
    expect(cssVar('-2.4', { prefix: 'vc-spacing' })).toMatchInlineSnapshot(`
      {
        "ref": "var(--vc-spacing--2\\\\.4)",
        "var": "--vc-spacing--2\\\\.4",
      }
    `)
  })

  test('with hash', () => {
    expect(cssVar('colors-red-200', { hash: true })).toMatchInlineSnapshot(`
      {
        "ref": "var(--bLdQLg)",
        "var": "--bLdQLg",
      }
    `)
  })

  test('with hash + prefix', () => {
    expect(cssVar('colors-red-200', { hash: true, prefix: 'pd' })).toMatchInlineSnapshot(`
      {
        "ref": "var(--pd-bLdQLg)",
        "var": "--pd-bLdQLg",
      }
    `)
  })

  test('with special characters', () => {
    expect(cssVar('.*+?^${}()|[]\\/', { prefix: 'special' })).toMatchInlineSnapshot(`
      {
        "ref": "var(--special-\\\\.\\\\*\\\\+\\\\?\\\\^\\\\$\\\\{\\\\}\\\\(\\\\)\\\\|\\\\[\\\\]\\\\\\\\\\\\/)",
        "var": "--special-\\\\.\\\\*\\\\+\\\\?\\\\^\\\\$\\\\{\\\\}\\\\(\\\\)\\\\|\\\\[\\\\]\\\\\\\\\\\\/",
      }
    `)
  })
})
