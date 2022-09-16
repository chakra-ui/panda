import { describe, expect, test } from 'vitest'
import { walkObject } from '../src'

describe('walk object', () => {
  test('should walk and transform', () => {
    const obj = {
      a: { b: { c: 3 } },
    }

    const result = walkObject(obj, (value) => {
      return `value is ${value}`
    })

    expect(result).toMatchInlineSnapshot(`
      {
        "a": {
          "b": {
            "c": "value is 3",
          },
        },
      }
    `)
  })
})
