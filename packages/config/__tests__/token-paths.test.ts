import { describe, expect, it } from 'vitest'
import { collectTokenPaths } from '../src/token-paths'

describe('collectTokenPaths', () => {
  it('collects from theme.tokens and theme.semanticTokens', () => {
    expect(
      collectTokenPaths({
        theme: {
          tokens: { colors: { brand: { value: '#ff0066' } } },
          semanticTokens: { colors: { text: { value: '{colors.brand}' } } },
        },
      }),
    ).toEqual(['colors.brand', 'colors.text'])
  })

  it('collects from theme.extend.tokens and theme.extend.semanticTokens', () => {
    expect(
      collectTokenPaths({
        theme: {
          extend: {
            tokens: { colors: { brand: { value: '#ff0066' } } },
            semanticTokens: { colors: { text: { value: '{colors.brand}' } } },
          },
        },
      }),
    ).toEqual(['colors.brand', 'colors.text'])
  })

  it('merges and dedupes paths across the base and extend layers', () => {
    expect(
      collectTokenPaths({
        theme: {
          tokens: { colors: { brand: { value: '#ff0066' } } },
          extend: { tokens: { colors: { brand: { value: '#0000ff' }, accent: { value: '#0f0' } } } },
        },
      }),
    ).toEqual(['colors.accent', 'colors.brand'])
  })

  it('returns an empty list when there is no theme', () => {
    expect(collectTokenPaths({})).toEqual([])
    expect(collectTokenPaths(undefined)).toEqual([])
  })
})
