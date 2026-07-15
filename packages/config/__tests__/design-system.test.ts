import { mkdtempSync, mkdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative } from 'node:path'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { resolveAuthoredPresets } from '../src/preset'

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

  test('fills importMap keys the manifest omits from the design-system root', async () => {
    const { config } = await resolveAuthoredPresets({ designSystem: '@acme/ds' }, cwd)

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
      preset: 'export default {}',
    })

    const { metadata } = await resolveAuthoredPresets({ designSystem: '@acme/future' }, cwd)

    expect(metadata?.designSystem?.[0]?.buildInfoPath).toMatch(/b\.json$/)
  })

  test('rejects a manifest missing a buildInfo entry', async () => {
    writeFileTree(moduleDir(cwd, '@acme/no-buildinfo'), {
      'package.json': json({ name: '@acme/no-buildinfo' }),
      'panda.lib.json': json({
        schemaVersion: 1,
        name: '@acme/no-buildinfo',
        panda: '^2.0.0',
        preset: './p.mjs',
      }),
      'p.mjs': 'export default {}',
    })

    await expect(resolveAuthoredPresets({ designSystem: '@acme/no-buildinfo' }, cwd)).rejects.toThrow(
      /missing a "buildInfo" entry/,
    )
  })

  test('flags class-name option overrides that break the design system runtime', async () => {
    const { metadata } = await resolveAuthoredPresets({ designSystem: '@acme/ds', hash: true }, cwd)
    expect(metadata?.designSystem?.[0]?.optionMismatch).toEqual(['hash'])
  })

  test('does not flag when class-name options match the design system', async () => {
    const { metadata } = await resolveAuthoredPresets({ designSystem: '@acme/ds' }, cwd)
    expect(metadata?.designSystem?.[0]?.optionMismatch).toBeUndefined()
  })

  // Manifest and package resolution failures.

  test('attaches diagnostics for an invalid manifest', async () => {
    await expect(resolveAuthoredPresets({ designSystem: '@acme/no-buildinfo' }, cwd)).rejects.toMatchObject({
      diagnostics: [
        {
          code: 'design_system_manifest_invalid',
          severity: 'error',
          category: 'config',
        },
      ],
    })
  })

  test('errors with guidance when the package does not resolve', async () => {
    await expect(resolveAuthoredPresets({ designSystem: '@acme/missing' }, cwd)).rejects.toThrow(
      /designSystem "@acme\/missing" could not be resolved/,
    )
  })

  test('attaches diagnostics when the package does not resolve', async () => {
    await expect(resolveAuthoredPresets({ designSystem: '@acme/missing' }, cwd)).rejects.toMatchObject({
      diagnostics: [
        {
          code: 'design_system_manifest_not_found',
          severity: 'error',
          category: 'config',
        },
      ],
    })
  })

  test('throws when manifest resolution fails for an unexpected reason', async () => {
    writeFileTree(moduleDir(cwd, '@acme/broken-resolve'), {
      'package.json': json({
        name: '@acme/broken-resolve',
        exports: {
          './panda.lib.json': 42,
        },
      }),
    })

    await expect(resolveAuthoredPresets({ designSystem: '@acme/broken-resolve' }, cwd)).rejects.toThrow(
      /Failed to resolve designSystem "@acme\/broken-resolve"/,
    )
  })

  test('attaches diagnostics when manifest resolution fails for an unexpected reason', async () => {
    await expect(resolveAuthoredPresets({ designSystem: '@acme/broken-resolve' }, cwd)).rejects.toMatchObject({
      diagnostics: [
        {
          code: 'design_system_resolve_failed',
          severity: 'error',
          category: 'config',
        },
      ],
    })
  })

  test('reports a parse error (not "failed to read") for a malformed manifest', async () => {
    writeFileTree(moduleDir(cwd, '@acme/bad-json'), {
      'package.json': json({ name: '@acme/bad-json', version: '1.0.0' }),
      'panda.lib.json': '{ not valid json',
    })
    const promise = resolveAuthoredPresets({ designSystem: '@acme/bad-json' }, cwd)
    await expect(promise).rejects.toThrow(/Failed to parse/)
    await expect(promise).rejects.toMatchObject({
      diagnostics: [{ code: 'design_system_manifest_invalid', severity: 'error', category: 'config' }],
    })
  })

  test('attaches a coded diagnostic when the preset module fails to load', async () => {
    writeFileTree(moduleDir(cwd, '@acme/bad-preset'), {
      'package.json': json({ name: '@acme/bad-preset', version: '1.0.0' }),
      'panda.lib.json': json({
        schemaVersion: 1,
        name: '@acme/bad-preset',
        panda: '^2.0.0',
        preset: './panda.preset.mjs',
        buildInfo: './panda.buildinfo.json',
      }),
      'panda.preset.mjs': 'throw new Error("boom in preset")',
    })
    await expect(resolveAuthoredPresets({ designSystem: '@acme/bad-preset' }, cwd)).rejects.toMatchObject({
      diagnostics: [{ code: 'design_system_preset_load_failed', severity: 'error', category: 'config' }],
    })
  })

  test('attaches a coded diagnostic when the preset module does not export a config object', async () => {
    writeFileTree(moduleDir(cwd, '@acme/invalid-preset'), {
      'package.json': json({ name: '@acme/invalid-preset', version: '1.0.0' }),
      'panda.lib.json': json({
        schemaVersion: 1,
        name: '@acme/invalid-preset',
        panda: '^2.0.0',
        preset: './panda.preset.mjs',
        buildInfo: './panda.buildinfo.json',
      }),
      'panda.preset.mjs': 'export default null',
    })
    await expect(resolveAuthoredPresets({ designSystem: '@acme/invalid-preset' }, cwd)).rejects.toMatchObject({
      diagnostics: [{ code: 'design_system_preset_load_failed', severity: 'error', category: 'config' }],
    })
  })

  test('distinguishes an installed package that does not expose panda.lib.json', async () => {
    writeFileTree(moduleDir(cwd, '@acme/no-export'), {
      'package.json': json({ name: '@acme/no-export', version: '1.0.0', exports: { '.': './index.js' } }),
      'index.js': 'export default {}',
      'panda.lib.json': json({
        schemaVersion: 1,
        name: '@acme/no-export',
        panda: '^2.0.0',
        preset: './panda.preset.mjs',
        buildInfo: './panda.buildinfo.json',
      }),
    })
    const promise = resolveAuthoredPresets({ designSystem: '@acme/no-export' }, cwd)
    await expect(promise).rejects.toThrow(/doesn't expose/)
    await expect(promise).rejects.toMatchObject({
      diagnostics: [{ code: 'design_system_manifest_not_exported', severity: 'error', category: 'config' }],
    })
  })

  test('rejects a workspace: protocol specifier with clear guidance', async () => {
    const promise = resolveAuthoredPresets({ designSystem: 'workspace:*' }, cwd)
    await expect(promise).rejects.toThrow(/isn't supported/)
    await expect(promise).rejects.toMatchObject({
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

  test('reports a cycle in the parent chain', async () => {
    await expect(resolveAuthoredPresets({ designSystem: '@acme/loop-a' }, cwd)).rejects.toThrow(
      /Design-system cycle: @acme\/loop-a → @acme\/loop-b → @acme\/loop-a/,
    )
  })

  test('attaches diagnostics for a cycle in the parent chain', async () => {
    await expect(resolveAuthoredPresets({ designSystem: '@acme/loop-a' }, cwd)).rejects.toMatchObject({
      diagnostics: [
        {
          code: 'design_system_cycle',
          severity: 'error',
          category: 'config',
        },
      ],
    })
  })

  test('reports a parent that is not installed alongside its declaring library', async () => {
    await expect(resolveAuthoredPresets({ designSystem: '@acme/orphan' }, cwd)).rejects.toThrow(
      /designSystem "@acme\/orphan" extends "@acme\/ghost"/,
    )
  })

  test('attaches diagnostics for a parent that is not installed alongside its declaring library', async () => {
    await expect(resolveAuthoredPresets({ designSystem: '@acme/orphan' }, cwd)).rejects.toMatchObject({
      diagnostics: [
        {
          code: 'design_system_parent_not_found',
          severity: 'error',
          category: 'config',
        },
      ],
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

// Fixture helpers

interface DesignSystemFixture {
  manifest?: Record<string, unknown>
  packageJson?: Record<string, unknown>
  preset?: Record<string, unknown> | string
}

interface DesignSystemPackageFixture extends DesignSystemFixture {
  cwd: string
  name: string
}

interface ResolvedDesignSystemLike {
  name: string
  manifest: {
    name?: string
  }
  buildInfoPath: string
  files: string[]
}

function writeFileTree(root: string, files: Record<string, string>): void {
  for (const [path, content] of Object.entries(files)) {
    const target = join(root, path)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, content)
  }
}

function moduleDir(root: string, specifier: string): string {
  return join(root, 'node_modules', ...specifier.split('/'))
}

function toRelativePaths(root: string, paths: string[]): string[] {
  return paths.map((path) => toRelativePath(root, path)).sort()
}

function toRelativePath(root: string, filePath: string): string {
  const realRoot = realpathSync(root)
  const normalizedPath = filePath.startsWith(root) ? `${realRoot}${filePath.slice(root.length)}` : filePath
  return relative(realRoot, normalizedPath).split('\\').join('/')
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

function writeDesignSystemPackage(fixture: DesignSystemPackageFixture): void {
  writeDesignSystemAt(moduleDir(fixture.cwd, fixture.name), fixture.name, fixture)
}

function writeDesignSystemAt(dir: string, fallbackName: string, fixture: DesignSystemFixture = {}): void {
  const manifest = {
    schemaVersion: 1,
    name: fallbackName,
    panda: '^2.0.0',
    preset: './panda.preset.mjs',
    buildInfo: './panda.buildinfo.json',
    ...fixture.manifest,
  }
  const presetPath = typeof manifest.preset === 'string' ? manifest.preset.replace(/^\.\//, '') : 'panda.preset.mjs'
  const packageName = typeof manifest.name === 'string' ? manifest.name : fallbackName

  writeFileTree(dir, {
    'package.json': json({ name: packageName, version: '1.0.0', ...fixture.packageJson }),
    'panda.lib.json': json(manifest),
    [presetPath]: presetModule(fixture.preset ?? { name: packageName }),
  })
}

function presetModule(preset: Record<string, unknown> | string): string {
  return typeof preset === 'string' ? preset : `export default ${json(preset)}`
}

function json(value: unknown): string {
  return JSON.stringify(value, null, 2)
}
