import { describe, expect, test } from 'vitest'
import { buildCodegenOverlay, collectArtifactConflicts, type ResolvedDesignSystem } from '../src/design-system'

function ds(
  overrides: Partial<ResolvedDesignSystem> & Pick<ResolvedDesignSystem, 'name' | 'specifier'>,
): ResolvedDesignSystem {
  return {
    manifest: {} as ResolvedDesignSystem['manifest'],
    manifestPath: `/node_modules/${overrides.specifier}/panda.lib.json`,
    buildInfoPath: `/node_modules/${overrides.specifier}/panda.buildinfo.json`,
    files: [],
    tokenPaths: [],
    recipeNames: [],
    patternNames: [],
    ...overrides,
  }
}

describe('buildCodegenOverlay', () => {
  test('derives roots and owned names from a single-level design system', () => {
    const overlay = buildCodegenOverlay({
      designSystem: [ds({ name: '@acme/ds', specifier: '@acme/ds', recipeNames: ['button'], patternNames: ['stack'] })],
      userRecipeNames: ['card'],
      userPatternNames: ['grid'],
    })

    expect(overlay).toEqual({
      jsx: '@acme/ds/jsx',
      recipes: '@acme/ds/recipes',
      patterns: '@acme/ds/patterns',
      ownedRecipes: ['button'],
      ownedPatterns: ['stack'],
    })
  })

  test('excludes app-redefined names from the owned sets', () => {
    const overlay = buildCodegenOverlay({
      designSystem: [
        ds({
          name: '@acme/ds',
          specifier: '@acme/ds',
          recipeNames: ['button', 'badge'],
          patternNames: ['stack', 'grid'],
        }),
      ],
      userRecipeNames: ['button'],
      userPatternNames: ['stack'],
    })

    expect(overlay?.ownedRecipes).toEqual(['badge'])
    expect(overlay?.ownedPatterns).toEqual(['grid'])
  })

  test('honors the manifest importMap for roots', () => {
    const overlay = buildCodegenOverlay({
      designSystem: [
        ds({
          name: '@acme/ds',
          specifier: '@acme/ds',
          importMap: { recipes: '@acme/ds/r' },
        }),
      ],
    })

    expect(overlay?.recipes).toBe('@acme/ds/r')
    expect(overlay?.jsx).toBe('@acme/ds/jsx')
  })

  test('returns undefined without a design system', () => {
    expect(buildCodegenOverlay(undefined)).toBeUndefined()
    expect(buildCodegenOverlay({})).toBeUndefined()
  })

  test('returns undefined for a nested chain (single-level only in v1)', () => {
    const overlay = buildCodegenOverlay({
      designSystem: [
        ds({ name: '@acme/ds', specifier: '@acme/ds' }),
        ds({ name: '@acme/base', specifier: '@acme/base' }),
      ],
    })
    expect(overlay).toBeUndefined()
  })
})

describe('collectArtifactConflicts', () => {
  test('reports recipe and pattern conflicts per design system across the chain', () => {
    const conflicts = collectArtifactConflicts({
      designSystem: [
        ds({ name: '@acme/ds', specifier: '@acme/ds', recipeNames: ['button'], patternNames: ['stack'] }),
        ds({ name: '@acme/base', specifier: '@acme/base', recipeNames: ['card'], patternNames: [] }),
      ],
      userRecipeNames: ['button', 'card'],
      userPatternNames: ['stack'],
    })

    expect(conflicts).toEqual([
      { name: '@acme/ds', recipes: ['button'], patterns: ['stack'] },
      { name: '@acme/base', recipes: ['card'], patterns: [] },
    ])
  })

  test('is empty when nothing overlaps', () => {
    expect(
      collectArtifactConflicts({
        designSystem: [ds({ name: '@acme/ds', specifier: '@acme/ds', recipeNames: ['button'] })],
        userRecipeNames: ['card'],
      }),
    ).toEqual([])
  })
})
