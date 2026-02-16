import { describe, expect, test } from 'vitest'
import { normalizePath, stripQuery } from '../src/utils'

describe('stripQuery', () => {
  test('strips ?v=hash', () => {
    expect(stripQuery('/src/app.tsx?v=abc123')).toBe('/src/app.tsx')
  })

  test('strips ?t=timestamp', () => {
    expect(stripQuery('/src/app.tsx?t=1234567890')).toBe('/src/app.tsx')
  })

  test('strips ?inline', () => {
    expect(stripQuery('virtual:panda.css?inline')).toBe('virtual:panda.css')
  })

  test('strips ?url', () => {
    expect(stripQuery('virtual:panda.css?url')).toBe('virtual:panda.css')
  })

  test('strips compound query string', () => {
    expect(stripQuery('/src/app.tsx?v=abc&t=123')).toBe('/src/app.tsx')
  })

  test('returns unchanged when no query', () => {
    expect(stripQuery('/src/app.tsx')).toBe('/src/app.tsx')
  })

  test('returns unchanged for empty string', () => {
    expect(stripQuery('')).toBe('')
  })
})

describe('normalizePath', () => {
  test('forward slashes are preserved', () => {
    expect(normalizePath('/src/components/Button.tsx')).toBe('/src/components/Button.tsx')
  })

  test('backslashes are converted to forward slashes', () => {
    expect(normalizePath('src\\components\\Button.tsx')).toBe('src/components/Button.tsx')
  })

  test('resolves .. segments', () => {
    const result = normalizePath('/src/components/../utils/index.ts')
    expect(result).toBe('/src/utils/index.ts')
  })

  test('resolves . segments', () => {
    const result = normalizePath('/src/./components/Button.tsx')
    expect(result).toBe('/src/components/Button.tsx')
  })

  test('mixed slashes are normalized', () => {
    expect(normalizePath('src\\components/Button.tsx')).toBe('src/components/Button.tsx')
  })
})
