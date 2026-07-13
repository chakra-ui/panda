import { describe, expect, it, test } from 'vitest'
import {
  buildCodegenOverlay,
  collectArtifactConflicts,
  collectExportMissingDiagnostics,
  type ResolvedDesignSystem,
} from '../src/design-system'

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

function pureConsumerMetadata() {
  return {
    designSystem: [ds({ name: '@acme/ui', specifier: '@acme/ui' })],
    appConfigKeys: {
      conditions: false,
      breakpoints: false,
      utilities: false,
      globalOptionsMatchDs: true,
    },
  }
}

function metadataWith(overrides: Partial<NonNullable<ReturnType<typeof pureConsumerMetadata>>['appConfigKeys']>) {
  const base = pureConsumerMetadata()
  return { ...base, appConfigKeys: { ...base.appConfigKeys, ...overrides } }
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
      css: '@acme/ds/css',
      helpers: '@acme/ds/helpers',
      ownedRecipes: ['button'],
      ownedPatterns: ['stack'],
      virtualizeUtils: true,
      virtualizeConditions: true,
      virtualizeCss: true,
    })
  })

  it('virtualizes entire runtime for a pure consumer', () => {
    const overlay = buildCodegenOverlay(pureConsumerMetadata())
    expect(overlay?.virtualizeUtils).toBe(true)
    expect(overlay?.virtualizeConditions).toBe(true)
    expect(overlay?.virtualizeCss).toBe(true)
    expect(overlay?.css).toBe('@acme/ui/css')
    expect(overlay?.helpers).toBe('@acme/ui/helpers')
  })

  it('keeps css + conditions local when app authors conditions', () => {
    const overlay = buildCodegenOverlay(metadataWith({ conditions: true }))
    expect(overlay?.virtualizeUtils).toBe(true)
    expect(overlay?.virtualizeConditions).toBe(false)
    expect(overlay?.virtualizeCss).toBe(false)
  })

  it('keeps the whole css/ dir local when app authors only utilities', () => {
    const overlay = buildCodegenOverlay(metadataWith({ utilities: true }))
    expect(overlay?.virtualizeUtils).toBe(true)
    expect(overlay?.virtualizeConditions).toBe(false)
    expect(overlay?.virtualizeCss).toBe(false)
  })

  it('keeps entire runtime local when a global option differs', () => {
    const overlay = buildCodegenOverlay(metadataWith({ globalOptionsMatchDs: false }))
    expect(overlay?.virtualizeUtils).toBe(false)
    expect(overlay?.virtualizeConditions).toBe(false)
    expect(overlay?.virtualizeCss).toBe(false)
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

describe('collectExportMissingDiagnostics', () => {
  test('reports a missing ./css/* export when the overlay virtualizes css', () => {
    const diagnostics = collectExportMissingDiagnostics({
      designSystem: [
        ds({
          name: '@acme/ds',
          specifier: '@acme/ds',
          packageExports: { '.': './index.js', './helpers': './helpers/index.js', './css': './css/index.js' },
        }),
      ],
    })

    expect(diagnostics).toEqual([
      expect.objectContaining({
        code: 'design_system_export_missing',
        severity: 'error',
        message: expect.stringContaining('./css/*'),
      }),
    ])
  })

  test('is empty when the exports map covers every virtualized subpath', () => {
    const diagnostics = collectExportMissingDiagnostics({
      designSystem: [
        ds({
          name: '@acme/ds',
          specifier: '@acme/ds',
          packageExports: {
            '.': './index.js',
            './helpers': './helpers/index.js',
            './css': './css/index.js',
            './css/*': './css/*.js',
          },
        }),
      ],
    })

    expect(diagnostics).toEqual([])
  })

  test('reports a missing bare ./css export when only ./css/* is present', () => {
    const diagnostics = collectExportMissingDiagnostics({
      designSystem: [
        ds({
          name: '@acme/ds',
          specifier: '@acme/ds',
          packageExports: {
            '.': './index.js',
            './helpers': './helpers/index.js',
            './css/*': './css/*.js',
          },
        }),
      ],
    })

    expect(diagnostics).toEqual([
      expect.objectContaining({
        code: 'design_system_export_missing',
        severity: 'error',
        message: expect.stringContaining('./css'),
      }),
    ])
    expect(diagnostics.some((d) => d.message.includes('"./css"'))).toBe(true)
  })

  test('returns nothing without a single-level overlay', () => {
    expect(collectExportMissingDiagnostics(undefined)).toEqual([])
    expect(
      collectExportMissingDiagnostics({
        designSystem: [
          ds({ name: '@acme/ds', specifier: '@acme/ds' }),
          ds({ name: '@acme/base', specifier: '@acme/base' }),
        ],
      }),
    ).toEqual([])
  })
})
