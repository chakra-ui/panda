import { describe, expect, test, vi } from 'vitest'
import { memo } from '../src/memo'

describe('memo', () => {
  test('should cache single string arguments', () => {
    const fn = vi.fn((value: string) => value.toUpperCase())
    const memoized = memo(fn)

    expect(memoized('fontSize')).toBe('FONTSIZE')
    expect(memoized('fontSize')).toBe('FONTSIZE')
    expect(memoized('lineHeight')).toBe('LINEHEIGHT')

    expect(fn).toHaveBeenCalledTimes(2)
  })

  test('should cache object arguments', () => {
    const fn = vi.fn((value: { a: number }) => value.a + 1)
    const memoized = memo(fn)

    expect(memoized({ a: 1 })).toBe(2)
    expect(memoized({ a: 1 })).toBe(2)
    expect(memoized({ a: 2 })).toBe(3)

    expect(fn).toHaveBeenCalledTimes(2)
  })

  test('should not collide between a string key and a serialized key', () => {
    const fn = vi.fn((value: unknown) => typeof value)
    const memoized = memo(fn)

    expect(memoized('[1]')).toBe('string')
    expect(memoized(1)).toBe('number')
  })

  test('should cache undefined results', () => {
    const fn = vi.fn((_value: string) => undefined)
    const memoized = memo(fn)

    memoized('a')
    memoized('a')

    expect(fn).toHaveBeenCalledTimes(1)
  })
})
