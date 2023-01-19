import { describe, expect, test } from 'vitest'
import { mergeProps } from '../src/merge-props'

describe('merge props', () => {
  test('can merge normal', () => {
    expect(mergeProps({ a: 1 }, { b: 2 })).toMatchInlineSnapshot(`
      {
        "a": 1,
        "b": 2,
      }
    `)
  })

  test('can merge with getKey', () => {
    expect(mergeProps({ a: 1, c: { e: 4 } }, { b: 2, c: { y: 7 } })).toMatchInlineSnapshot(`
      {
        "a": 1,
        "b": 2,
        "c": {
          "e": 4,
          "y": 7,
        },
      }
    `)
  })
})
