import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { resolveAuthoredPresets } from '../src/preset'

describe('resolveAuthoredPresets / designSystem', () => {
  let cwd: string

  beforeAll(() => {
    cwd = mkdtempSync(join(tmpdir(), 'panda-ds-'))
    const pkg = join(cwd, 'node_modules', '@acme', 'ds')
    mkdirSync(pkg, { recursive: true })
    writeFileSync(join(pkg, 'package.json'), JSON.stringify({ name: '@acme/ds', version: '1.0.0' }))
    writeFileSync(
      join(pkg, 'panda.lib.json'),
      JSON.stringify({
        schemaVersion: 1,
        name: '@acme/ds',
        panda: '^2.0.0',
        preset: './preset.mjs',
        buildInfo: './panda.buildinfo.json',
        importMap: { css: '@acme/ds/css', recipes: '@acme/ds/recipes', jsx: '@acme/ds/jsx' },
        files: ['./dist/**/*.mjs'],
      }),
    )
    writeFileSync(
      join(pkg, 'preset.mjs'),
      `export default { name: '@acme/ds', theme: { tokens: { colors: { brand: { value: 'ds' }, dsOnly: { value: 'ds' } } } } }`,
    )
  })

  afterAll(() => rmSync(cwd, { recursive: true, force: true }))

  test('merges the published preset under the consuming config', async () => {
    const { config, dependencies } = await resolveAuthoredPresets(
      { designSystem: '@acme/ds', theme: { tokens: { colors: { brand: { value: 'app' } } } } } as any,
      cwd,
    )

    const colors = config.theme?.tokens?.colors
    if (!colors) throw new Error('expected resolved color tokens')
    expect(colors.brand.value).toBe('app')
    expect(colors.dsOnly.value).toBe('ds')
    expect(dependencies.some((d) => d.endsWith('panda.lib.json'))).toBe(true)
    expect(dependencies.some((d) => d.endsWith('preset.mjs'))).toBe(true)
    expect(dependencies.some((d) => d.endsWith('panda.buildinfo.json'))).toBe(true)
  })

  test('wires the dual-root importMap (DS roots + local outdir)', async () => {
    const { config, metadata } = await resolveAuthoredPresets({ designSystem: '@acme/ds' } as any, cwd)

    expect(config.importMap).toEqual([
      {
        css: '@acme/ds/css',
        recipes: '@acme/ds/recipes',
        patterns: '@acme/ds/patterns',
        jsx: '@acme/ds/jsx',
        tokens: '@acme/ds/tokens',
      },
      'styled-system',
    ])
    expect(metadata?.designSystem?.map((ds) => ds.name)).toEqual(['@acme/ds'])
    expect(metadata?.designSystem?.[0]?.manifest.name).toBe('@acme/ds')
    expect(metadata?.designSystem?.[0]?.buildInfoPath).toMatch(/panda\.buildinfo\.json$/)
    expect(metadata?.designSystem?.[0]?.files).toEqual(['./dist/**/*.mjs'])
  })

  test('respects a custom outdir basename in the wired importMap', async () => {
    const { config } = await resolveAuthoredPresets({ designSystem: '@acme/ds', outdir: 'src/design' } as any, cwd)
    expect(config.importMap).toEqual([
      {
        css: '@acme/ds/css',
        recipes: '@acme/ds/recipes',
        patterns: '@acme/ds/patterns',
        jsx: '@acme/ds/jsx',
        tokens: '@acme/ds/tokens',
      },
      'design',
    ])
  })

  test('keeps the design-system root first when the consumer already has an importMap', async () => {
    const { config } = await resolveAuthoredPresets({ designSystem: '@acme/ds', importMap: '@my/aliases' } as any, cwd)
    expect((config.importMap as any[])[0]).toMatchObject({ css: '@acme/ds/css' })
    expect((config.importMap as any[])[1]).toBe('styled-system')
    expect((config.importMap as any[])[2]).toBe('@my/aliases')
  })

  test('fills importMap keys the manifest omits from the design-system root', async () => {
    const { config } = await resolveAuthoredPresets({ designSystem: '@acme/ds' } as any, cwd)
    const [dsRoot] = config.importMap as any[]
    expect(dsRoot.patterns).toBe('@acme/ds/patterns')
    expect(dsRoot.tokens).toBe('@acme/ds/tokens')
  })

  test('defers manifest compatibility to compiler hydration', async () => {
    const pkg = join(cwd, 'node_modules', '@acme', 'future')
    mkdirSync(pkg, { recursive: true })
    writeFileSync(join(pkg, 'package.json'), JSON.stringify({ name: '@acme/future' }))
    writeFileSync(
      join(pkg, 'panda.lib.json'),
      JSON.stringify({
        schemaVersion: 999,
        name: '@acme/future',
        panda: '^2.0.0',
        preset: './p.mjs',
        buildInfo: './b.json',
      }),
    )
    writeFileSync(join(pkg, 'p.mjs'), 'export default {}')

    const { metadata } = await resolveAuthoredPresets({ designSystem: '@acme/future' } as any, cwd)
    expect(metadata?.designSystem?.[0]?.buildInfoPath).toMatch(/b\.json$/)
  })

  test('rejects a manifest missing a buildInfo entry', async () => {
    const pkg = join(cwd, 'node_modules', '@acme', 'no-buildinfo')
    mkdirSync(pkg, { recursive: true })
    writeFileSync(join(pkg, 'package.json'), JSON.stringify({ name: '@acme/no-buildinfo' }))
    writeFileSync(
      join(pkg, 'panda.lib.json'),
      JSON.stringify({ schemaVersion: 1, name: '@acme/no-buildinfo', panda: '^2.0.0', preset: './p.mjs' }),
    )
    writeFileSync(join(pkg, 'p.mjs'), 'export default {}')
    await expect(resolveAuthoredPresets({ designSystem: '@acme/no-buildinfo' } as any, cwd)).rejects.toThrow(
      /missing a "buildInfo" entry/,
    )
  })

  test('errors with guidance when the package does not resolve', async () => {
    await expect(resolveAuthoredPresets({ designSystem: '@acme/missing' } as any, cwd)).rejects.toThrow(
      /designSystem "@acme\/missing" could not be resolved/,
    )
  })
})

describe('resolveAuthoredPresets / designSystem nested chains', () => {
  let cwd: string

  const writeManifest = (dir: string, manifest: Record<string, unknown>, preset: string) => {
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: manifest.name }))
    writeFileSync(join(dir, 'panda.lib.json'), JSON.stringify({ schemaVersion: 1, panda: '^2.0.0', ...manifest }))
    writeFileSync(join(dir, 'preset.mjs'), preset)
  }

  beforeAll(() => {
    cwd = mkdtempSync(join(tmpdir(), 'panda-ds-chain-'))
    const mods = join(cwd, 'node_modules')

    writeManifest(
      join(mods, '@acme', 'marketing'),
      {
        name: '@acme/marketing',
        preset: './preset.mjs',
        buildInfo: './bi.json',
        designSystem: '@acme/foundations',
        importMap: { css: '@acme/marketing/css' },
      },
      `export default { name: '@acme/marketing', theme: { tokens: { colors: { brand: { value: 'mk' }, mkOnly: { value: 'mk' } } } } }`,
    )
    writeManifest(
      join(mods, '@acme', 'marketing', 'node_modules', '@acme', 'foundations'),
      { name: '@acme/foundations', preset: './preset.mjs', buildInfo: './bi.json' },
      `export default { name: '@acme/foundations', theme: { tokens: { colors: { brand: { value: 'fd' }, fdOnly: { value: 'fd' } } } } }`,
    )

    writeManifest(
      join(mods, '@acme', 'loop-a'),
      { name: '@acme/loop-a', preset: './preset.mjs', buildInfo: './bi.json', designSystem: '@acme/loop-b' },
      `export default { name: '@acme/loop-a' }`,
    )
    writeManifest(
      join(mods, '@acme', 'loop-b'),
      { name: '@acme/loop-b', preset: './preset.mjs', buildInfo: './bi.json', designSystem: '@acme/loop-a' },
      `export default { name: '@acme/loop-b' }`,
    )

    writeManifest(
      join(mods, '@acme', 'orphan'),
      { name: '@acme/orphan', preset: './preset.mjs', buildInfo: './bi.json', designSystem: '@acme/ghost' },
      `export default { name: '@acme/orphan' }`,
    )

    writeManifest(
      join(mods, '@acme', 'skinned'),
      { name: '@acme/skinned', preset: './preset.mjs', buildInfo: './bi.json', designSystem: '@acme/raw' },
      `export default { name: '@acme/skinned', theme: { tokens: { colors: { brand: { value: 'skin' }, skinOnly: { value: 'skin' } } } } }`,
    )
    writeManifest(
      join(mods, '@acme', 'raw'),
      { name: '@acme/raw-identity', preset: './preset.mjs', buildInfo: './bi.json' },
      `export default { name: '@acme/raw-identity', theme: { tokens: { colors: { brand: { value: 'raw' }, rawOnly: { value: 'raw' } } } } }`,
    )
  })

  afterAll(() => rmSync(cwd, { recursive: true, force: true }))

  test('merges ancestors root-first so the leaf and the app override the root', async () => {
    const { config } = await resolveAuthoredPresets(
      { designSystem: '@acme/marketing', theme: { tokens: { colors: { brand: { value: 'app' } } } } } as any,
      cwd,
    )
    const colors = config.theme?.tokens?.colors
    if (!colors) throw new Error('expected resolved color tokens')
    expect(colors.brand.value).toBe('app')
    expect(colors.mkOnly.value).toBe('mk')
    expect(colors.fdOnly.value).toBe('fd')
  })

  test('records the resolved chain root-first in metadata', async () => {
    const { metadata } = await resolveAuthoredPresets({ designSystem: '@acme/marketing' } as any, cwd)
    expect(metadata?.designSystem?.map((ds) => ds.name)).toEqual(['@acme/foundations', '@acme/marketing'])
  })

  test('wires one importMap root per design system, root-first, then the local outdir', async () => {
    const { config } = await resolveAuthoredPresets({ designSystem: '@acme/marketing' } as any, cwd)
    expect(config.importMap).toEqual([
      '@acme/foundations',
      {
        css: '@acme/marketing/css',
        recipes: '@acme/marketing/recipes',
        patterns: '@acme/marketing/patterns',
        jsx: '@acme/marketing/jsx',
        tokens: '@acme/marketing/tokens',
      },
      'styled-system',
    ])
  })

  test('reports a cycle in the parent chain', async () => {
    await expect(resolveAuthoredPresets({ designSystem: '@acme/loop-a' } as any, cwd)).rejects.toThrow(
      /Design-system cycle: @acme\/loop-a → @acme\/loop-b → @acme\/loop-a/,
    )
  })

  test('reports a parent that is not installed alongside its declaring library', async () => {
    await expect(resolveAuthoredPresets({ designSystem: '@acme/orphan' } as any, cwd)).rejects.toThrow(
      /designSystem "@acme\/orphan" extends "@acme\/ghost"/,
    )
  })

  test('links the chain by specifier, so a parent whose manifest name differs still merges as the root', async () => {
    const { config, metadata } = await resolveAuthoredPresets({ designSystem: '@acme/skinned' } as any, cwd)
    const colors = config.theme?.tokens?.colors
    if (!colors) throw new Error('expected resolved color tokens')
    expect(colors.brand.value).toBe('skin')
    expect(colors.rawOnly.value).toBe('raw')
    expect(colors.skinOnly.value).toBe('skin')
    expect(metadata?.designSystem?.map((ds) => ds.name)).toEqual(['@acme/raw-identity', '@acme/skinned'])
  })
})
