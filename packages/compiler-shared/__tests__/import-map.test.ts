import { describe, expect, it } from 'vitest'
import { normalizeImportMap, prepareCompilerConfig } from '../src'

describe('normalizeImportMap', () => {
  it('expands a string root to category paths', () => {
    expect(normalizeImportMap({ outdir: 'styled-system', importMap: '@acme/ui' })).toEqual({
      css: ['@acme/ui/css'],
      recipe: ['@acme/ui/recipes'],
      pattern: ['@acme/ui/patterns'],
      jsx: ['@acme/ui/jsx'],
      tokens: ['@acme/ui/tokens'],
    })
  })

  it('merges multiple string roots in array order', () => {
    expect(normalizeImportMap({ outdir: 'styled-system', importMap: ['@acme/ui', 'styled-system'] })).toEqual({
      css: ['@acme/ui/css', 'styled-system/css'],
      recipe: ['@acme/ui/recipes', 'styled-system/recipes'],
      pattern: ['@acme/ui/patterns', 'styled-system/patterns'],
      jsx: ['@acme/ui/jsx', 'styled-system/jsx'],
      tokens: ['@acme/ui/tokens', 'styled-system/tokens'],
    })
  })

  it('normalizes object input with v1 plural keys', () => {
    expect(
      normalizeImportMap({
        outdir: 'styled-system',
        importMap: {
          css: '@panda/css',
          recipes: '@panda/recipes',
          patterns: ['@panda/patterns', '@panda/more-patterns'],
          jsx: '@panda/jsx',
          tokens: '@panda/tokens',
        },
      }),
    ).toEqual({
      css: ['@panda/css'],
      recipe: ['@panda/recipes'],
      pattern: ['@panda/patterns', '@panda/more-patterns'],
      jsx: ['@panda/jsx'],
      tokens: ['@panda/tokens'],
    })
  })

  it('accepts already-normalized singular keys', () => {
    expect(
      normalizeImportMap({
        outdir: 'styled-system',
        importMap: {
          css: ['@panda/css'],
          recipe: ['@panda/recipes'],
          pattern: ['@panda/patterns'],
          jsx: ['@panda/jsx'],
          tokens: ['@panda/tokens'],
        },
      }),
    ).toEqual({
      css: ['@panda/css'],
      recipe: ['@panda/recipes'],
      pattern: ['@panda/patterns'],
      jsx: ['@panda/jsx'],
      tokens: ['@panda/tokens'],
    })
  })

  it('defaults missing categories to outdir basename', () => {
    expect(normalizeImportMap({ outdir: './src/styled-system' })).toEqual({
      css: ['styled-system/css'],
      recipe: ['styled-system/recipes'],
      pattern: ['styled-system/patterns'],
      jsx: ['styled-system/jsx'],
      tokens: ['styled-system/tokens'],
    })
  })

  it('is idempotent on normalized output', () => {
    const normalized = normalizeImportMap({ outdir: 'styled-system', importMap: '@acme/ui' })
    expect(normalizeImportMap({ outdir: 'styled-system', importMap: normalized })).toEqual(normalized)
  })
})

describe('prepareCompilerConfig', () => {
  it('expands string importMap on the config snapshot', () => {
    const prepared = prepareCompilerConfig({
      cwd: '/app',
      outdir: 'styled-system',
      importMap: '@acme/ui',
    })

    expect(prepared.importMap).toEqual({
      css: ['@acme/ui/css'],
      recipe: ['@acme/ui/recipes'],
      pattern: ['@acme/ui/patterns'],
      jsx: ['@acme/ui/jsx'],
      tokens: ['@acme/ui/tokens'],
    })
  })
})
