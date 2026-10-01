import { describe, expect, it } from 'vitest'
import { collectListFlags, normalizeInclude } from '../src/args'

describe('collectListFlags', () => {
  it('collects every value of a repeated --include', () => {
    expect(collectListFlags(['cssgen', '--include', 'src/**', '--include', 'app/**'])).toEqual({
      include: ['src/**', 'app/**'],
    })
  })

  it('reads the --include=value form', () => {
    expect(collectListFlags(['--include=src/**', '--include=app/**'])).toEqual({ include: ['src/**', 'app/**'] })
  })

  it('mixes both forms in argv order', () => {
    expect(collectListFlags(['--include', 'src/**', '--include=app/**'])).toEqual({ include: ['src/**', 'app/**'] })
  })

  it('keeps a brace glob as one value', () => {
    expect(collectListFlags(['--include', 'src/**/*.{ts,tsx}'])).toEqual({ include: ['src/**/*.{ts,tsx}'] })
  })

  it('collects repeated --files for lib', () => {
    expect(collectListFlags(['lib', '--files', 'dist/**', '--files', 'src/**'])).toEqual({
      files: ['dist/**', 'src/**'],
    })
  })

  it('stops at the -- separator', () => {
    expect(collectListFlags(['--include', 'src/**', '--', '--include', 'ignored/**'])).toEqual({ include: ['src/**'] })
  })

  it('ignores a trailing --include with no value', () => {
    expect(collectListFlags(['cssgen', '--include'])).toEqual({})
  })

  it('returns nothing when no list flag is passed', () => {
    expect(collectListFlags(['cssgen', '--json'])).toEqual({})
  })
})

describe('normalizeInclude', () => {
  it('keeps a brace glob whole', () => {
    expect(normalizeInclude('src/**/*.{ts,tsx}')).toEqual(['src/**/*.{ts,tsx}'])
  })

  it('does not split on commas', () => {
    expect(normalizeInclude('src/**,app/**')).toEqual(['src/**,app/**'])
  })

  it('keeps each repeated glob', () => {
    expect(normalizeInclude(['src/**/*.{ts,tsx}', 'app/**'])).toEqual(['src/**/*.{ts,tsx}', 'app/**'])
  })

  it('drops empty values', () => {
    expect(normalizeInclude(['  ', 'src/**'])).toEqual(['src/**'])
  })
})
