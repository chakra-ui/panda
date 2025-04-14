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

  test('text styles', () => {
    expect(mergeProps({ lineHeight: 1.2, textStyle: '3xl' }, { textStyle: { lg: '6xl', xl: '7xl' } }))
      .toMatchInlineSnapshot(`
        {
          "lineHeight": 1.2,
          "textStyle": {
            "lg": "6xl",
            "xl": "7xl",
          },
        }
      `)
  })

  test('should prevent prototype pollution', () => {
    const maliciousPayload = { __proto__: { polluted: true } }
    const result = mergeProps<any>({ safe: 'value' }, maliciousPayload)

    expect(result).toMatchInlineSnapshot(`
      {
        "safe": "value",
      }
    `)
    expect(({} as any).polluted).toBeUndefined()
  })

  test('should prevent constructor pollution', () => {
    const maliciousPayload = { constructor: { polluted: true } }
    const result = mergeProps<any>({ safe: 'value' }, maliciousPayload)

    expect(result).toMatchInlineSnapshot(`
      {
        "safe": "value",
      }
    `)
    expect(({} as any).polluted).toBeUndefined()
  })

  test('should prevent prototype chain pollution', () => {
    const maliciousPayload = { nested: { __proto__: { polluted: true } } }
    const result = mergeProps<any>({ safe: 'value', nested: { ok: true } }, maliciousPayload)

    expect(result).toMatchInlineSnapshot(`
      {
        "nested": {
          "ok": true,
        },
        "safe": "value",
      }
    `)
    expect(({} as any).polluted).toBeUndefined()
  })
})
