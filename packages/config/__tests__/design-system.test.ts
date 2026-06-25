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
  })

  test('wires the dual-root importMap (DS roots + local outdir)', async () => {
    const { config, metadata } = await resolveAuthoredPresets({ designSystem: '@acme/ds' } as any, cwd)

    expect(config.importMap).toEqual([
      { css: '@acme/ds/css', recipes: '@acme/ds/recipes', jsx: '@acme/ds/jsx' },
      'styled-system',
    ])
    expect(metadata?.designSystem?.name).toBe('@acme/ds')
    expect(metadata?.designSystem?.buildInfoPath).toMatch(/panda\.buildinfo\.json$/)
    expect(metadata?.designSystem?.files).toEqual(['./dist/**/*.mjs'])
  })

  test('respects a custom outdir basename in the wired importMap', async () => {
    const { config } = await resolveAuthoredPresets({ designSystem: '@acme/ds', outdir: 'src/design' } as any, cwd)
    expect(config.importMap).toEqual([
      { css: '@acme/ds/css', recipes: '@acme/ds/recipes', jsx: '@acme/ds/jsx' },
      'design',
    ])
  })

  test('rejects a consumer whose Panda major is outside the manifest range', async () => {
    await expect(
      resolveAuthoredPresets({ designSystem: '@acme/ds' } as any, cwd, { pandaVersion: '1.9.0' }),
    ).rejects.toThrow(/requires Panda \^2\.0\.0 \(you are on 1\.9\.0\)/)
  })

  test('accepts a matching Panda major', async () => {
    const { config } = await resolveAuthoredPresets({ designSystem: '@acme/ds' } as any, cwd, { pandaVersion: '2.3.1' })
    const colors = config.theme?.tokens?.colors
    if (!colors) throw new Error('expected resolved color tokens')
    expect(colors.dsOnly.value).toBe('ds')
  })

  test('rejects a manifest built for a different schema version', async () => {
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
    await expect(resolveAuthoredPresets({ designSystem: '@acme/future' } as any, cwd)).rejects.toThrow(
      /different Panda manifest format/,
    )
  })

  test('errors with guidance when the package does not resolve', async () => {
    await expect(resolveAuthoredPresets({ designSystem: '@acme/missing' } as any, cwd)).rejects.toThrow(
      /designSystem "@acme\/missing" could not be resolved/,
    )
  })
})
