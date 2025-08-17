import { describe, expect, test } from 'vitest'
import { pick } from '../src/pick'

describe('pick', () => {
  test('should pick specified paths from flat object', () => {
    const obj = { a: 1, b: 2, c: 3, d: 4 }
    const result = pick(obj, ['a', 'c'])
    expect(result).toEqual({ a: 1, c: 3 })
  })

  test('should pick nested paths', () => {
    const obj = {
      theme: {
        colors: {
          red: { value: '#ff0000' },
          blue: { value: '#0000ff' },
        },
        spacing: {
          sm: { value: '0.5rem' },
          md: { value: '1rem' },
        },
      },
      utilities: {
        color: { className: 'text' },
      },
    }

    const result = pick(obj, ['theme.colors.red', 'theme.spacing.sm'])
    expect(result).toEqual({
      theme: {
        colors: {
          red: { value: '#ff0000' },
        },
        spacing: {
          sm: { value: '0.5rem' },
        },
      },
    })
  })

  test('should handle non-existent paths gracefully', () => {
    const obj = { a: 1, b: 2 }
    const result = pick(obj, ['a', 'nonexistent'])
    expect(result).toEqual({ a: 1 })
  })

  test('should return empty object when no paths match', () => {
    const obj = { a: 1, b: 2 }
    const result = pick(obj, ['nonexistent'])
    expect(result).toEqual({})
  })

  test('should handle empty paths array', () => {
    const obj = { a: 1, b: 2 }
    const result = pick(obj, [])
    expect(result).toEqual({})
  })

  test('should handle complex nested structures', () => {
    const obj = {
      theme: {
        tokens: {
          colors: {
            primary: { value: '#007bff' },
            secondary: { value: '#6c757d' },
          },
          sizes: {
            sm: { value: '0.875rem' },
            lg: { value: '1.25rem' },
          },
        },
        breakpoints: {
          sm: '640px',
          md: '768px',
        },
      },
      patterns: {
        stack: { properties: ['gap'] },
      },
    }

    const result = pick(obj, ['theme.tokens.colors.primary', 'theme.breakpoints.md', 'patterns.stack'])

    expect(result).toEqual({
      theme: {
        tokens: {
          colors: {
            primary: { value: '#007bff' },
          },
        },
        breakpoints: {
          md: '768px',
        },
      },
      patterns: {
        stack: { properties: ['gap'] },
      },
    })
  })
})
