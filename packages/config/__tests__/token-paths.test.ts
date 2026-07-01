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

  it('dedupes paths from the canonical token layer', () => {
    expect(
      collectTokenPaths({
        theme: {
          tokens: { colors: { brand: { value: '#ff0066' } } },
          semanticTokens: { colors: { brand: { value: '{colors.brand}' }, accent: { value: '{colors.brand}' } } },
        },
      }),
    ).toEqual(['colors.accent', 'colors.brand'])
  })

  it('collects nested token paths', () => {
    expect(
      collectTokenPaths({
        theme: {
          tokens: {
            colors: {
              brand: {
                primary: { value: '#ff0066' },
              },
            },
          },
        },
      }),
    ).toEqual(['colors.brand.primary'])
  })

  it('returns an empty list when there is no theme', () => {
    expect(collectTokenPaths({})).toEqual([])
    expect(collectTokenPaths(undefined)).toEqual([])
  })
})
