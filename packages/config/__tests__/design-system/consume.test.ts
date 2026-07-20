import { join } from 'node:path'
import { describe, expect } from 'vitest'
import { loadConfig } from '../../src/load'
import {
  moduleDir,
  test,
  toRelativePaths,
  writeDesignSystemAt,
  writeDesignSystemPackage,
  writeFileTree,
} from './helpers'

function tokenColors(config: { theme?: { tokens?: { colors?: Record<string, unknown> } } }) {
  const colors = config.theme?.tokens?.colors ?? {}
  return Object.fromEntries(
    Object.entries(colors).map(([key, token]) => [
      key,
      typeof token === 'object' && token !== null && 'value' in token ? (token as { value: unknown }).value : undefined,
    ]),
  )
}

describe('loadConfig / designSystem consume', () => {
  test('merges a published design system (exports + manifest + preset + buildinfo)', async ({ cwd }) => {
    writeDesignSystemPackage({
      cwd,
      name: '@acme/ds',
      manifest: {
        importMap: {
          css: '@acme/ds/css',
          recipes: '@acme/ds/recipes',
          jsx: '@acme/ds/jsx',
        },
      },
      preset: {
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
    writeFileTree(cwd, {
      'panda.config.ts': `export default {
        designSystem: '@acme/ds',
        theme: { tokens: { colors: { brand: { value: 'app' } } } },
      }`,
    })

    const result = await loadConfig({ cwd })

    expect(tokenColors(result.config)).toEqual({ brand: 'app', dsOnly: 'ds' })
    // loadConfig serializes dual-root importMap into per-entry arrays.
    expect(result.config.importMap).toEqual({
      css: ['@acme/ds/css', 'styled-system/css'],
      jsx: ['@acme/ds/jsx', 'styled-system/jsx'],
      pattern: ['@acme/ds/patterns', 'styled-system/patterns'],
      recipe: ['@acme/ds/recipes', 'styled-system/recipes'],
      tokens: ['@acme/ds/tokens', 'styled-system/tokens'],
    })
    expect(toRelativePaths(cwd, result.dependencies)).toEqual(
      expect.arrayContaining([
        'node_modules/@acme/ds/panda/buildinfo.json',
        'node_modules/@acme/ds/panda/lib.json',
        'node_modules/@acme/ds/panda/preset.mjs',
      ]),
    )
    expect(result.dependencies.some((dep) => dep.endsWith('panda.config.ts'))).toBe(true)
    expect(result.metadata?.designSystem?.[0]?.optionMismatch).toBeUndefined()
  })

  test('merges a nested foundations → marketing → app chain with published exports', async ({ cwd }) => {
    writeDesignSystemPackage({
      cwd,
      name: '@acme/marketing',
      manifest: {
        designSystem: '@acme/foundations',
        importMap: {
          css: '@acme/marketing/css',
          recipes: '@acme/marketing/recipes',
          jsx: '@acme/marketing/jsx',
        },
      },
      preset: {
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
    writeDesignSystemAt(
      join(moduleDir(cwd, '@acme/marketing'), 'node_modules', '@acme', 'foundations'),
      '@acme/foundations',
      {
        preset: {
          theme: {
            tokens: {
              colors: {
                brand: { value: 'fd' },
                fdOnly: { value: 'fd' },
              },
            },
          },
        },
      },
    )
    writeFileTree(cwd, {
      'panda.config.ts': `export default {
        designSystem: '@acme/marketing',
        theme: { tokens: { colors: { brand: { value: 'app' } } } },
      }`,
    })

    const result = await loadConfig({ cwd })

    expect(result.metadata?.designSystem?.map((ds) => ds.name)).toEqual(['@acme/foundations', '@acme/marketing'])
    expect(tokenColors(result.config)).toEqual({ brand: 'app', fdOnly: 'fd', mkOnly: 'mk' })
    expect(result.metadata?.designSystem?.every((ds) => ds.optionMismatch === undefined)).toBe(true)
  })

  test('keeps optionMismatch empty when class-name options match the design system', async ({ cwd }) => {
    writeDesignSystemPackage({
      cwd,
      name: '@acme/options',
      preset: {
        hash: true,
        prefix: 'acme',
        separator: '-',
        theme: { tokens: { colors: { brand: { value: 'ds' } } } },
      },
    })
    writeFileTree(cwd, {
      'panda.config.ts': `export default {
        designSystem: '@acme/options',
        hash: true,
        prefix: 'acme',
        separator: '-',
      }`,
    })

    const result = await loadConfig({ cwd })

    expect(result.metadata?.designSystem?.[0]?.optionMismatch).toBeUndefined()
    expect(tokenColors(result.config)).toEqual({ brand: 'ds' })
  })

  test('rejects a package installed without a ./panda/* export', async ({ cwd }) => {
    writeDesignSystemPackage({
      cwd,
      name: '@acme/no-export',
      packageJson: { exports: { '.': './index.js' } },
    })
    writeFileTree(moduleDir(cwd, '@acme/no-export'), {
      'index.js': 'export default {}',
    })
    writeFileTree(cwd, {
      'panda.config.ts': `export default { designSystem: '@acme/no-export' }`,
    })

    await expect(loadConfig({ cwd })).rejects.toMatchObject({
      diagnostics: [{ code: 'design_system_manifest_not_exported', severity: 'error', category: 'config' }],
    })
  })

  test('rejects a missing designSystem package', async ({ cwd }) => {
    writeFileTree(cwd, {
      'panda.config.ts': `export default { designSystem: '@acme/missing' }`,
    })

    await expect(loadConfig({ cwd })).rejects.toMatchObject({
      diagnostics: [{ code: 'design_system_manifest_not_found', severity: 'error', category: 'config' }],
    })
  })

  test('rejects a malformed panda/lib.json with a parse diagnostic', async ({ cwd }) => {
    writeDesignSystemPackage({ cwd, name: '@acme/bad-json', writeBuildInfo: false })
    writeFileTree(moduleDir(cwd, '@acme/bad-json'), {
      'panda/lib.json': '{ not valid json',
    })
    writeFileTree(cwd, {
      'panda.config.ts': `export default { designSystem: '@acme/bad-json' }`,
    })

    await expect(loadConfig({ cwd })).rejects.toMatchObject({
      message: expect.stringMatching(/Failed to parse/),
      diagnostics: [{ code: 'design_system_manifest_invalid', severity: 'error', category: 'config' }],
    })
  })

  test('rejects a preset that throws or does not export an object', async ({ cwd }) => {
    writeDesignSystemPackage({
      cwd,
      name: '@acme/bad-preset',
      preset: 'throw new Error("boom in preset")',
    })
    writeFileTree(cwd, {
      'panda.config.ts': `export default { designSystem: '@acme/bad-preset' }`,
    })

    await expect(loadConfig({ cwd })).rejects.toMatchObject({
      diagnostics: [{ code: 'design_system_preset_load_failed', severity: 'error', category: 'config' }],
    })
  })

  test('rejects a parent that is not installed beside its declaring library', async ({ cwd }) => {
    writeDesignSystemPackage({
      cwd,
      name: '@acme/orphan',
      manifest: { designSystem: '@acme/ghost' },
      preset: 'export default {}',
    })
    writeFileTree(cwd, {
      'panda.config.ts': `export default { designSystem: '@acme/orphan' }`,
    })

    await expect(loadConfig({ cwd })).rejects.toMatchObject({
      diagnostics: [{ code: 'design_system_parent_not_found', severity: 'error', category: 'config' }],
    })
  })

  test('rejects a cycle in manifest.designSystem', async ({ cwd }) => {
    writeDesignSystemPackage({
      cwd,
      name: '@acme/loop-a',
      manifest: { designSystem: '@acme/loop-b' },
      preset: 'export default {}',
    })
    writeDesignSystemPackage({
      cwd,
      name: '@acme/loop-b',
      manifest: { designSystem: '@acme/loop-a' },
      preset: 'export default {}',
    })
    writeFileTree(cwd, {
      'panda.config.ts': `export default { designSystem: '@acme/loop-a' }`,
    })

    await expect(loadConfig({ cwd })).rejects.toMatchObject({
      diagnostics: [{ code: 'design_system_cycle', severity: 'error', category: 'config' }],
    })
  })

  test('rejects an unsupported workspace: designSystem specifier', async ({ cwd }) => {
    writeFileTree(cwd, {
      'panda.config.ts': `export default { designSystem: 'workspace:*' }`,
    })

    await expect(loadConfig({ cwd })).rejects.toMatchObject({
      diagnostics: [{ code: 'design_system_unsupported_specifier', severity: 'error', category: 'config' }],
    })
  })

  test('flags consumer hash/prefix/separator overrides away from the design system', async ({ cwd }) => {
    writeDesignSystemPackage({
      cwd,
      name: '@acme/strict',
      preset: {
        hash: true,
        prefix: 'acme',
        separator: '-',
        theme: { tokens: { colors: { brand: { value: 'ds' } } } },
      },
    })
    writeFileTree(cwd, {
      'panda.config.ts': `export default {
        designSystem: '@acme/strict',
        hash: false,
        prefix: 'app',
        separator: '_',
      }`,
    })

    const result = await loadConfig({ cwd })

    expect(result.metadata?.designSystem?.[0]?.optionMismatch?.sort()).toEqual(['hash', 'prefix', 'separator'])
    expect(tokenColors(result.config)).toEqual({ brand: 'ds' })
  })
})
