import { mkdtempSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { resolveAuthoredPresets } from '../../src/preset'
import {
  json,
  moduleDir,
  toRelativePath,
  toRelativePaths,
  writeDesignSystemAt,
  writeDesignSystemPackage,
  writeFileTree,
} from './helpers'

describe('resolveAuthoredPresets / designSystem', () => {
  let cwd: string

  beforeAll(() => {
    cwd = mkdtempSync(join(tmpdir(), 'panda-ds-'))

    // Base package used by the single design-system tests.
    writeDesignSystemPackage({
      cwd,
      name: '@acme/ds',
      manifest: {
        importMap: {
          css: '@acme/ds/css',
          recipes: '@acme/ds/recipes',
          jsx: '@acme/ds/jsx',
        },
        files: ['./dist/**/*.mjs'],
      },
      preset: {
        name: '@acme/ds',
        theme: {
          tokens: {
            colors: {
              brand: { value: 'ds' },
              dsOnly: { value: 'ds' },
            },
          },
        },
      },
    })
  })

  afterAll(() => rmSync(cwd, { recursive: true, force: true }))

  test('merges the published preset under the consuming config', async () => {
    const { config, dependencies } = await resolveAuthoredPresets(
      {
        designSystem: '@acme/ds',
        theme: {
          tokens: {
            colors: {
              brand: { value: 'app' },
            },
          },
        },
      },
      cwd,
    )

    expect(tokenValues(config.theme?.tokens?.colors)).toMatchInlineSnapshot(`
      {
        "brand": "app",
        "dsOnly": "ds",
      }
    `)

    expect(toRelativePaths(cwd, dependencies)).toMatchInlineSnapshot(`
      [
        "node_modules/@acme/ds/panda.buildinfo.json",
        "node_modules/@acme/ds/panda.lib.json",
        "node_modules/@acme/ds/panda.preset.mjs",
      ]
    `)
  })

  test('wires the dual-root importMap (DS roots + local outdir)', async () => {
    const { config, metadata } = await resolveAuthoredPresets({ designSystem: '@acme/ds' }, cwd)

    expect(config.importMap).toMatchInlineSnapshot(`
      [
        {
          "css": "@acme/ds/css",
          "jsx": "@acme/ds/jsx",
          "patterns": "@acme/ds/patterns",
          "recipes": "@acme/ds/recipes",
          "tokens": "@acme/ds/tokens",
        },
        "styled-system",
      ]
    `)

    expect(designSystemMetadata(cwd, metadata?.designSystem)).toMatchInlineSnapshot(`
      [
        {
          "buildInfoPath": "node_modules/@acme/ds/panda.buildinfo.json",
          "files": [
            "./dist/**/*.mjs",
          ],
          "manifestName": "@acme/ds",
          "name": "@acme/ds",
        },
      ]
    `)
  })

  test('collects token metadata after resolving design-system and consumer config blocks', async () => {
    const { metadata } = await resolveAuthoredPresets(
      {
        designSystem: '@acme/ds',
        theme: {
          extend: {
            tokens: {
              colors: {
                brand: { value: 'app' },
                appOnly: { value: 'app' },
              },
            },
          },
        },
      },
      cwd,
    )

    expect({
      userTokenPaths: metadata?.userTokenPaths,
      designSystemTokenPaths: metadata?.designSystem?.map((ds) => ds.tokenPaths),
    }).toMatchInlineSnapshot(`
      {
        "designSystemTokenPaths": [
          [
            "colors.brand",
            "colors.dsOnly",
          ],
        ],
        "userTokenPaths": [
          "colors.appOnly",
          "colors.brand",
        ],
      }
    `)
  })

  test('respects a custom outdir basename in the wired importMap', async () => {
    const { config } = await resolveAuthoredPresets(
      {
        designSystem: '@acme/ds',
        outdir: 'src/design',
      },
      cwd,
    )

    expect(config.importMap).toMatchInlineSnapshot(`
      [
        {
          "css": "@acme/ds/css",
          "jsx": "@acme/ds/jsx",
          "patterns": "@acme/ds/patterns",
          "recipes": "@acme/ds/recipes",
          "tokens": "@acme/ds/tokens",
        },
        "design",
      ]
    `)
  })

  test('keeps the design-system root first when the consumer already has an importMap', async () => {
    const { config } = await resolveAuthoredPresets(
      {
        designSystem: '@acme/ds',
        importMap: '@my/aliases',
      },
      cwd,
    )

    expect(config.importMap).toMatchInlineSnapshot(`
      [
        {
          "css": "@acme/ds/css",
          "jsx": "@acme/ds/jsx",
          "patterns": "@acme/ds/patterns",
          "recipes": "@acme/ds/recipes",
          "tokens": "@acme/ds/tokens",
        },
        "styled-system",
        "@my/aliases",
      ]
    `)
  })

  test('defers manifest compatibility to compiler hydration', async () => {
    writeDesignSystemPackage({
      cwd,
      name: '@acme/future',
      manifest: {
        schemaVersion: 999,
        preset: './p.mjs',
        buildInfo: './b.json',
      },
      preset: 'export default { theme: { tokens: { colors: { future: { value: "ok" } } } } }',
    })

    const { config, metadata } = await resolveAuthoredPresets({ designSystem: '@acme/future' }, cwd)

    expect(metadata?.designSystem?.[0]?.buildInfoPath).toMatch(/b\.json$/)
    expect(tokenValues(config.theme?.tokens?.colors)).toMatchObject({ future: 'ok' })
  })

  test('rejects a manifest missing a buildInfo entry', async () => {
    writeDesignSystemPackage({
      cwd,
      name: '@acme/no-buildinfo',
      manifest: {
        preset: './p.mjs',
        buildInfo: undefined,
      },
      preset: 'export default {}',
      writeBuildInfo: false,
    })

    await expect(resolveAuthoredPresets({ designSystem: '@acme/no-buildinfo' }, cwd)).rejects.toMatchObject({
      message: expect.stringMatching(/missing a "buildInfo" entry/),
      diagnostics: [{ code: 'design_system_manifest_invalid', severity: 'error', category: 'config' }],
    })
  })

  test('flags class-name option overrides that break the design system runtime', async () => {
    const { metadata, config } = await resolveAuthoredPresets({ designSystem: '@acme/ds', hash: true }, cwd)
    expect(metadata?.designSystem?.[0]?.optionMismatch).toEqual(['hash'])
    expect(tokenValues(config.theme?.tokens?.colors)).toMatchObject({ brand: 'ds', dsOnly: 'ds' })
  })

  test('does not flag when class-name options match the design system', async () => {
    const { metadata, config } = await resolveAuthoredPresets({ designSystem: '@acme/ds' }, cwd)
    expect(metadata?.designSystem?.[0]?.optionMismatch).toBeUndefined()
    expect(tokenValues(config.theme?.tokens?.colors)).toMatchObject({ brand: 'ds' })
  })

  test('does not flag explicit values that equal the normalized defaults', async () => {
    const { metadata, config } = await resolveAuthoredPresets(
      {
        designSystem: '@acme/ds',
        hash: false,
        prefix: { className: '', cssVar: '' },
        separator: '_',
      },
      cwd,
    )
    expect(metadata?.designSystem?.[0]?.optionMismatch).toBeUndefined()
    expect(tokenValues(config.theme?.tokens?.colors)).toMatchObject({ brand: 'ds' })
  })

  test('compares prefix fields by value rather than object property order', async () => {
    writeDesignSystemPackage({
      cwd,
      name: '@acme/prefixed',
      preset: { prefix: { cssVar: 'acme', className: 'ui' } },
    })

    const { metadata } = await resolveAuthoredPresets(
      { designSystem: '@acme/prefixed', prefix: { className: 'ui', cssVar: 'acme' } },
      cwd,
    )
    expect(metadata?.designSystem?.[0]?.optionMismatch).toBeUndefined()
  })

  // Manifest and package resolution failures.

  test.each([
    ['schemaVersion', { schemaVersion: 0 }, 'positive integer "schemaVersion"'],
    ['name', { name: '  ' }, 'missing a "name" entry'],
    ['panda', { panda: '' }, 'missing a "panda" entry'],
    ['files', { files: './button.js' }, '"files" entry'],
    ['importMap', { importMap: { css: ['@acme/ds/css'] } }, '"importMap.css" entry'],
  ])('validates the complete manifest shape before loading its preset (%s)', async (field, manifest, message) => {
    const name = `@acme/invalid-${field}`
    writeDesignSystemPackage({
      cwd,
      name,
      manifest,
      preset: 'throw new Error("the preset must not be imported")',
    })

    await expect(resolveAuthoredPresets({ designSystem: name }, cwd)).rejects.toMatchObject({
      diagnostics: [
        {
          code: 'design_system_manifest_invalid',
          severity: 'error',
          category: 'config',
          file: expect.stringMatching(/panda\.lib\.json$/),
          message: expect.stringContaining(message),
        },
      ],
    })
  })

  test('rejects a package that does not resolve', async () => {
    await expect(resolveAuthoredPresets({ designSystem: '@acme/missing' }, cwd)).rejects.toMatchObject({
      message: expect.stringMatching(/designSystem "@acme\/missing" could not be resolved/),
      diagnostics: [{ code: 'design_system_manifest_not_found', severity: 'error', category: 'config' }],
    })
  })

  test('rejects when manifest resolution fails for an unexpected reason', async () => {
    writeFileTree(moduleDir(cwd, '@acme/broken-resolve'), {
      'package.json': json({
        name: '@acme/broken-resolve',
        exports: {
          './panda.lib.json': 42,
        },
      }),
    })

    await expect(resolveAuthoredPresets({ designSystem: '@acme/broken-resolve' }, cwd)).rejects.toMatchObject({
      message: expect.stringMatching(/Failed to resolve designSystem "@acme\/broken-resolve"/),
      diagnostics: [{ code: 'design_system_resolve_failed', severity: 'error', category: 'config' }],
    })
  })

  test('rejects a malformed manifest with a parse diagnostic', async () => {
    writeDesignSystemPackage({
      cwd,
      name: '@acme/bad-json',
      writeBuildInfo: false,
    })
    writeFileTree(moduleDir(cwd, '@acme/bad-json'), {
      'panda.lib.json': '{ not valid json',
    })

    await expect(resolveAuthoredPresets({ designSystem: '@acme/bad-json' }, cwd)).rejects.toMatchObject({
      message: expect.stringMatching(/Failed to parse/),
      diagnostics: [{ code: 'design_system_manifest_invalid', severity: 'error', category: 'config' }],
    })
  })

  test('rejects when the preset module fails to load', async () => {
    writeDesignSystemPackage({
      cwd,
      name: '@acme/bad-preset',
      preset: 'throw new Error("boom in preset")',
    })

    await expect(resolveAuthoredPresets({ designSystem: '@acme/bad-preset' }, cwd)).rejects.toMatchObject({
      diagnostics: [{ code: 'design_system_preset_load_failed', severity: 'error', category: 'config' }],
    })
  })

  test('rejects when the preset module does not export a config object', async () => {
    writeDesignSystemPackage({
      cwd,
      name: '@acme/invalid-preset',
      preset: 'export default null',
    })

    await expect(resolveAuthoredPresets({ designSystem: '@acme/invalid-preset' }, cwd)).rejects.toMatchObject({
      diagnostics: [{ code: 'design_system_preset_load_failed', severity: 'error', category: 'config' }],
    })
  })

  test('rejects an installed package that does not expose panda.lib.json', async () => {
    writeDesignSystemPackage({
      cwd,
      name: '@acme/no-export',
      packageJson: { exports: { '.': './index.js' } },
    })
    writeFileTree(moduleDir(cwd, '@acme/no-export'), {
      'index.js': 'export default {}',
    })

    await expect(resolveAuthoredPresets({ designSystem: '@acme/no-export' }, cwd)).rejects.toMatchObject({
      message: expect.stringMatching(/doesn't expose/),
      diagnostics: [{ code: 'design_system_manifest_not_exported', severity: 'error', category: 'config' }],
    })
  })

  test('rejects a workspace: protocol specifier', async () => {
    await expect(resolveAuthoredPresets({ designSystem: 'workspace:*' }, cwd)).rejects.toMatchObject({
      message: expect.stringMatching(/isn't supported/),
      diagnostics: [{ code: 'design_system_unsupported_specifier', severity: 'error', category: 'config' }],
    })
  })
})

describe('resolveAuthoredPresets / designSystem nested chains', () => {
  let cwd: string

  beforeAll(() => {
    cwd = mkdtempSync(join(tmpdir(), 'panda-ds-chain-'))

    // Chain fixture:
    // node_modules/
    //   @acme/marketing/
    //     panda.lib.json -> designSystem: "@acme/foundations"
    //     node_modules/@acme/foundations/
    const marketingDir = moduleDir(cwd, '@acme/marketing')
    const foundationsDir = moduleDir(marketingDir, '@acme/foundations')

    writeDesignSystemPackage({
      cwd,
      name: '@acme/marketing',
      manifest: {
        designSystem: '@acme/foundations',
        importMap: { css: '@acme/marketing/css' },
      },
      preset: {
        name: '@acme/marketing',
        theme: {
          tokens: {
            colors: {
              brand: { value: 'mk' },
              mkOnly: { value: 'mk' },
            },
          },
        },
      },
    })

    writeDesignSystemAt(foundationsDir, '@acme/foundations', {
      preset: {
        name: '@acme/foundations',
        hash: true,
        theme: {
          tokens: {
            colors: {
              brand: { value: 'fd' },
              fdOnly: { value: 'fd' },
            },
          },
        },
      },
    })

    // Invalid chains.
    writeDesignSystemPackage({
      cwd,
      name: '@acme/loop-a',
      manifest: { designSystem: '@acme/loop-b' },
    })
    writeDesignSystemPackage({
      cwd,
      name: '@acme/loop-b',
      manifest: { designSystem: '@acme/loop-a' },
    })

    writeDesignSystemPackage({
      cwd,
      name: '@acme/orphan',
      manifest: { designSystem: '@acme/ghost' },
    })

    // Package specifier and manifest name may differ.
    writeDesignSystemPackage({
      cwd,
      name: '@acme/skinned',
      manifest: { designSystem: '@acme/raw' },
      preset: {
        name: '@acme/skinned',
        theme: {
          tokens: {
            colors: {
              brand: { value: 'skin' },
              skinOnly: { value: 'skin' },
            },
          },
        },
      },
    })
    writeDesignSystemPackage({
      cwd,
      name: '@acme/raw',
      manifest: { name: '@acme/raw-identity' },
      preset: {
        name: '@acme/raw-identity',
        theme: {
          tokens: {
            colors: {
              brand: { value: 'raw' },
              rawOnly: { value: 'raw' },
            },
          },
        },
      },
    })
  })

  afterAll(() => rmSync(cwd, { recursive: true, force: true }))

  test('merges ancestors root-first so the leaf and the app override the root', async () => {
    const { config } = await resolveAuthoredPresets(
      {
        designSystem: '@acme/marketing',
        theme: {
          tokens: {
            colors: {
              brand: { value: 'app' },
            },
          },
        },
      },
      cwd,
    )

    expect(tokenValues(config.theme?.tokens?.colors)).toMatchInlineSnapshot(`
      {
        "brand": "app",
        "fdOnly": "fd",
        "mkOnly": "mk",
      }
    `)
  })

  test('records the resolved chain root-first in metadata', async () => {
    const { metadata } = await resolveAuthoredPresets({ designSystem: '@acme/marketing' }, cwd)

    expect(metadata?.designSystem?.map((ds) => ds.name)).toEqual(['@acme/foundations', '@acme/marketing'])
  })

  test('compares child options against the effective inherited chain', async () => {
    const { metadata, config } = await resolveAuthoredPresets({ designSystem: '@acme/marketing', hash: true }, cwd)

    expect(metadata?.designSystem?.map((ds) => ds.optionMismatch)).toEqual([undefined, undefined])
    expect(tokenValues(config.theme?.tokens?.colors)).toMatchObject({ brand: 'mk', fdOnly: 'fd', mkOnly: 'mk' })
  })

  test('flags a consumer override away from the inherited chain options', async () => {
    const { metadata, config } = await resolveAuthoredPresets({ designSystem: '@acme/marketing', hash: false }, cwd)

    expect(metadata?.designSystem?.map((ds) => ds.optionMismatch)).toEqual([['hash'], ['hash']])
    expect(tokenValues(config.theme?.tokens?.colors)).toMatchObject({ brand: 'mk' })
  })

  test('wires one importMap root per design system, root-first, then the local outdir', async () => {
    const { config } = await resolveAuthoredPresets({ designSystem: '@acme/marketing' }, cwd)

    expect(config.importMap).toMatchInlineSnapshot(`
      [
        "@acme/foundations",
        {
          "css": "@acme/marketing/css",
          "jsx": "@acme/marketing/jsx",
          "patterns": "@acme/marketing/patterns",
          "recipes": "@acme/marketing/recipes",
          "tokens": "@acme/marketing/tokens",
        },
        "styled-system",
      ]
    `)
  })

  test('rejects a cycle in the parent chain', async () => {
    await expect(resolveAuthoredPresets({ designSystem: '@acme/loop-a' }, cwd)).rejects.toMatchObject({
      message: expect.stringMatching(/Design-system cycle: @acme\/loop-a → @acme\/loop-b → @acme\/loop-a/),
      diagnostics: [{ code: 'design_system_cycle', severity: 'error', category: 'config' }],
    })
  })

  test('rejects a parent that is not installed alongside its declaring library', async () => {
    await expect(resolveAuthoredPresets({ designSystem: '@acme/orphan' }, cwd)).rejects.toMatchObject({
      message: expect.stringMatching(/designSystem "@acme\/orphan" extends "@acme\/ghost"/),
      diagnostics: [{ code: 'design_system_parent_not_found', severity: 'error', category: 'config' }],
    })
  })

  test('links the chain by specifier, so a parent whose manifest name differs still merges as the root', async () => {
    const { config, metadata } = await resolveAuthoredPresets({ designSystem: '@acme/skinned' }, cwd)

    expect(tokenValues(config.theme?.tokens?.colors)).toMatchInlineSnapshot(`
      {
        "brand": "skin",
        "rawOnly": "raw",
        "skinOnly": "skin",
      }
    `)

    expect(metadata?.designSystem?.map((ds) => ds.name)).toEqual(['@acme/raw-identity', '@acme/skinned'])
    expect(config.importMap).toEqual(['@acme/raw', '@acme/skinned', 'styled-system'])
  })

  test('rejects a chain where two different packages share a name', async () => {
    const dupCwd = realpathSync(mkdtempSync(join(tmpdir(), 'panda-ds-dup-')))
    // `@acme/dup` extends `@acme/dup-parent`, but the parent names itself `@acme/dup` too.
    writeDesignSystemAt(moduleDir(dupCwd, '@acme/dup'), '@acme/dup', {
      manifest: { designSystem: '@acme/dup-parent' },
      preset: 'export default {}',
    })
    writeDesignSystemAt(moduleDir(dupCwd, '@acme/dup-parent'), '@acme/dup-parent', {
      manifest: { name: '@acme/dup' },
      preset: 'export default {}',
    })

    await expect(resolveAuthoredPresets({ designSystem: '@acme/dup' }, dupCwd)).rejects.toMatchObject({
      diagnostics: [{ code: 'design_system_duplicate_name', severity: 'error', category: 'config' }],
    })

    rmSync(dupCwd, { recursive: true, force: true })
  })
})

interface ResolvedDesignSystemLike {
  name: string
  manifest: {
    name?: string
  }
  buildInfoPath: string
  files: string[]
}

function designSystemMetadata(root: string, designSystems: ResolvedDesignSystemLike[] | undefined) {
  return designSystems?.map((ds) => ({
    name: ds.name,
    manifestName: ds.manifest.name,
    buildInfoPath: toRelativePath(root, ds.buildInfoPath),
    files: ds.files,
  }))
}

function tokenValues(tokens: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!tokens) return {}
  return Object.fromEntries(
    Object.entries(tokens).map(([key, token]) => [
      key,
      typeof token === 'object' && token !== null && 'value' in token ? token.value : undefined,
    ]),
  )
}
