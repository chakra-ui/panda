import { describe, expect, test } from 'vitest'
import { splitProps } from '../src/split-props'

describe('split props', () => {
  test('it works with array split', () => {
    const obj = { a: 1, b: 2, c: 3, d: 4 }
    const [a, b, c] = splitProps(obj, ['a', 'b'], ['c'])

    expect(a).toEqual({ a: 1, b: 2 })
    expect(b).toEqual({ c: 3 })
    expect(c).toEqual({ d: 4 })
  })

  test('it works with predicate split', () => {
    const obj = { a: 1, b: 2, c: 3, d: 4 }
    const result = splitProps(obj, (key) => key === 'a' || key === 'b')

    expect(result).toMatchInlineSnapshot(`
      [
        {
          "a": 1,
          "b": 2,
        },
        {
          "c": 3,
          "d": 4,
        },
      ]
    `)
  })

  test('it works with predicate split and array split', () => {
    const obj = { a: 1, b: 2, c: 3, d: 4 }
    const [a, b, c] = splitProps(obj, (key) => key === 'a' || key === 'b', ['c'])

    expect(a).toEqual({ a: 1, b: 2 })
    expect(b).toEqual({ c: 3 })
    expect(c).toEqual({ d: 4 })
  })
})
