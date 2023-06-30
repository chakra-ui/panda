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

  test('should walk and stop at array', () => {
    const obj = {
      a: { b: { c: [1, 2, 3] } },
    }

    const result = walkObject(
      obj,
      (value) => {
        return `value is ${value}`
      },
      {
        stop(value) {
          return Array.isArray(value)
        },
      },
    )

    expect(result).toMatchInlineSnapshot(`
      {
        "a": {
          "b": {
            "c": "value is 1,2,3",
          },
        },
      }
    `)
  })

  test('should walk and stop at max depth', () => {
    const obj = {
      a: { b: { c: [1, 2, 3] } },
    }

    const result = walkObject(
      obj,
      (value) => {
        return `value is ${JSON.stringify(value)}`
      },
      {
        stop(_, path) {
          return path.length > 2
        },
      },
    )

    expect(result).toMatchInlineSnapshot(`
      {
        "a": {
          "b": "value is {\\"c\\":[1,2,3]}",
        },
      }
    `)
  })

  test('should not set prop with nullish value', () => {
    const shorthands = {
      flexDir: 'flexDirection',
    }

    const obj = {
      flexDir: 'row',
      flexDirection: undefined,
    }

    const result = walkObject(obj, (value) => value, {
      getKey(prop) {
        return shorthands[prop] ?? prop
      },
    })

    expect(result).toMatchInlineSnapshot(`
      {
        "flexDirection": "row",
      }
    `)
  })
})
