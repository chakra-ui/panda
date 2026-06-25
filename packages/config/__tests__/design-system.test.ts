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
    expect(metadata?.designSystem?.name).toBe('@acme/ds')
    expect(metadata?.designSystem?.manifest.name).toBe('@acme/ds')
    expect(metadata?.designSystem?.buildInfoPath).toMatch(/panda\.buildinfo\.json$/)
    expect(metadata?.designSystem?.files).toEqual(['./dist/**/*.mjs'])
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
    expect(metadata?.designSystem?.buildInfoPath).toMatch(/b\.json$/)
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

  test('rejects parent design systems in the single-level loader', async () => {
    const pkg = join(cwd, 'node_modules', '@acme', 'child')
    mkdirSync(pkg, { recursive: true })
    writeFileSync(join(pkg, 'package.json'), JSON.stringify({ name: '@acme/child' }))
    writeFileSync(
      join(pkg, 'panda.lib.json'),
      JSON.stringify({
        schemaVersion: 1,
        name: '@acme/child',
        panda: '^2.0.0',
        preset: './p.mjs',
        buildInfo: './b.json',
        designSystem: '@acme/base',
      }),
    )
    writeFileSync(join(pkg, 'p.mjs'), 'export default {}')
    await expect(resolveAuthoredPresets({ designSystem: '@acme/child' } as any, cwd)).rejects.toThrow(
      /nested design systems are not supported yet/,
    )
  })

  test('errors with guidance when the package does not resolve', async () => {
    await expect(resolveAuthoredPresets({ designSystem: '@acme/missing' } as any, cwd)).rejects.toThrow(
      /designSystem "@acme\/missing" could not be resolved/,
    )
  })
})
