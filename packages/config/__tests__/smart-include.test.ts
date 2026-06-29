import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { resolveAuthoredPresets } from '../src/preset'
import { resolveSmartInclude, SMART_INCLUDE_EXTENSIONS } from '../src/smart-include'

const EXT = SMART_INCLUDE_EXTENSIONS.join(',')

describe('resolveAuthoredPresets / smart include', () => {
  let cwd: string

  const pkg = (name: string, files: Record<string, string>, extra: Record<string, unknown> = {}) => {
    const dir = join(cwd, 'node_modules', ...name.split('/'))
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name, ...extra }))
    for (const [file, content] of Object.entries(files)) {
      mkdirSync(join(dir, ...file.split('/').slice(0, -1)), { recursive: true })
      writeFileSync(join(dir, file), content)
    }
  }

  const manifest = (name: string) =>
    JSON.stringify({ schemaVersion: 1, name, panda: '^2.0.0', preset: './p.mjs', buildInfo: './b.json' })

  beforeAll(() => {
    cwd = realpathSync(mkdtempSync(join(tmpdir(), 'panda-include-')))

    pkg('@acme/charts', { 'index.js': 'export const Chart = () => {}' })
    pkg('widgets', { 'index.js': 'export const Widget = () => {}' })
    pkg('components', { 'index.js': 'export const PackageComponent = () => {}' })

    pkg('@acme/sealed', { 'dist/index.js': 'export const Sealed = () => {}' }, { exports: { '.': './dist/index.js' } })

    pkg('@acme/ds', { 'panda.lib.json': manifest('@acme/ds') })
    pkg('@acme/ds2', { 'panda.lib.json': manifest('@acme/ds2') })

    pkg(
      '@acme/sealed-ds',
      { 'dist/index.js': 'export default {}', 'panda.lib.json': manifest('@acme/sealed-ds') },
      { exports: { '.': './dist/index.js' } },
    )

    mkdirSync(join(cwd, 'components'), { recursive: true })
  })

  afterAll(() => rmSync(cwd, { recursive: true, force: true }))

  test('auto-globs a consumed package that ships no manifest (scoped and unscoped)', async () => {
    const { config, dependencies } = await resolveAuthoredPresets(
      { include: ['./src/**/*.tsx', '@acme/charts', 'widgets'] } as any,
      cwd,
    )
    expect(config.include).toEqual([
      './src/**/*.tsx',
      `node_modules/@acme/charts/**/*.{${EXT}}`,
      `node_modules/widgets/**/*.{${EXT}}`,
    ])
    expect(config.exclude).toEqual([
      'node_modules/@acme/charts/**/node_modules/**',
      'node_modules/widgets/**/node_modules/**',
    ])
    expect(dependencies.some((d) => d.endsWith(join('@acme', 'charts', 'package.json')))).toBe(true)
    expect(dependencies.some((d) => d.endsWith(join('widgets', 'package.json')))).toBe(true)
  })

  test("appends the nested node_modules guard to the user's existing excludes", async () => {
    const { config } = await resolveAuthoredPresets(
      { include: ['@acme/charts'], exclude: ['**/*.stories.tsx'] } as any,
      cwd,
    )
    expect(config.exclude).toEqual(['**/*.stories.tsx', 'node_modules/@acme/charts/**/node_modules/**'])
  })

  test('resolveSmartInclude returns the rewritten include, nested-node_modules excludes, and a dep', () => {
    const deps = new Set<string>()
    const result = resolveSmartInclude(['@acme/charts', './src/**/*.ts'], cwd, deps)
    expect(result.changed).toBe(true)
    expect(result.include).toEqual([`node_modules/@acme/charts/**/*.{${EXT}}`, './src/**/*.ts'])
    expect(result.excludes).toEqual(['node_modules/@acme/charts/**/node_modules/**'])
    expect([...deps].some((d) => d.endsWith(join('@acme', 'charts', 'package.json')))).toBe(true)
  })

  test('resolveSmartInclude leaves a glob-only list unchanged', () => {
    const result = resolveSmartInclude(['**/*.tsx', './app/**'], cwd, new Set())
    expect(result.changed).toBe(false)
    expect(result.excludes).toEqual([])
  })

  test('resolves a package whose exports hide ./package.json via its entry', async () => {
    const { config } = await resolveAuthoredPresets({ include: ['@acme/sealed'] } as any, cwd)
    expect(config.include).toEqual([`node_modules/@acme/sealed/**/*.{${EXT}}`])
  })

  test('redirects a manifest-bearing package to designSystem', async () => {
    await expect(resolveAuthoredPresets({ include: ['@acme/ds'] } as any, cwd)).rejects.toThrow(
      /Design system in `include`: "@acme\/ds".*it belongs in `designSystem`/s,
    )
  })

  test('detects a manifest on disk even when exports would hide it', async () => {
    await expect(resolveAuthoredPresets({ include: ['@acme/sealed-ds'] } as any, cwd)).rejects.toThrow(
      /Design system in `include`: "@acme\/sealed-ds"/,
    )
  })

  test('batches every manifest-bearing offender into one error, skipping consumers', async () => {
    await expect(
      resolveAuthoredPresets({ include: ['@acme/ds', '@acme/charts', '@acme/ds2'] } as any, cwd),
    ).rejects.toThrow(/Design systems in `include`: "@acme\/ds", "@acme\/ds2"/)
  })

  test('leaves globs, paths, and local directory names untouched', async () => {
    const include = [
      '**/*.tsx',
      './app/**/*.ts',
      '../shared/**/*.ts',
      'src/components/**',
      '+(a|b).ts',
      '@(x).ts',
      '[abc].ts',
      '{a,b}.ts',
      'components',
      '@acme/not-installed',
    ]
    const { config } = await resolveAuthoredPresets({ include } as any, cwd)
    expect(config.include).toEqual(include)
  })

  test('prefers an existing local path over a package with the same name', async () => {
    const { config } = await resolveAuthoredPresets({ include: ['components'] } as any, cwd)
    expect(config.include).toEqual(['components'])
    expect(config.exclude).toBeUndefined()
  })

  test('is a no-op when there is no include', async () => {
    const { config } = await resolveAuthoredPresets({} as any, cwd)
    expect(config.include).toBeUndefined()
  })
})
