import { describe, expect, it } from 'vitest'
import { collectListFlags, normalizeInclude } from '../src/args'

describe('collectListFlags', () => {
  it('collects repeated --files for lib', () => {
    expect(collectListFlags(['lib', '--files', 'dist/**', '--files', 'src/**'])).toEqual({
      files: ['dist/**', 'src/**'],
    })
  })

  it('reads --include between other command flags', () => {
    expect(collectListFlags(['cssgen', '--cwd', '/tmp/app', '--include', 'src/**', '--json'])).toEqual({
      include: ['src/**'],
    })
  })

  it('ignores a trailing --include with no value', () => {
    expect(collectListFlags(['cssgen', '--include'])).toEqual({})
  })
})

describe('normalizeInclude', () => {
  it('does not split on commas', () => {
    expect(normalizeInclude('src/**,app/**')).toEqual(['src/**,app/**'])
  })

  it('drops empty values', () => {
    expect(normalizeInclude(['  ', 'src/**'])).toEqual(['src/**'])
  })
})
