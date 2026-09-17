import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runCodegen, runLib } from '../src'
import { CONFIG, CONFIG_WITH_TOKENS, cleanupFixture, createFixture } from './helpers'

describe('codegen command', () => {
  let dir: string | undefined

  afterEach(() => {
    cleanupFixture(dir)
    dir = undefined
  })

  it('writes styled-system files', async () => {
    dir = createFixture()

    const logs: string[] = []
    const result = await runCodegen({ cwd: dir }, { log: (message) => logs.push(message) })

    expect(result.files.some((path) => path.endsWith('css/css.js'))).toBe(true)
    expect(readFileSync(join(dir, 'styled-system', 'css', 'css.js'), 'utf8')).toContain('css')

    expect(logs[0]).toContain('codegen: wrote')
  })

  it('leaves the design system spec out unless asked', async () => {
    dir = createFixture(CONFIG_WITH_TOKENS)

    await runCodegen({ cwd: dir, logLevel: 'silent' })

    expect(existsSync(join(dir, 'styled-system', 'specs', 'design-system.json'))).toBe(false)
  })

  it('generates a local consumer runtime without --spec', async () => {
    dir = createFixture()
    const parent = join(dir, 'node_modules', '@acme', 'ds')
    mkdirSync(parent, { recursive: true })
    writeFileSync(join(parent, 'package.json'), JSON.stringify({ name: '@acme/ds', version: '1.0.0' }))
    writeFileSync(join(parent, 'panda.config.ts'), CONFIG)
    expect((await runCodegen({ cwd: parent, logLevel: 'silent' })).ok).toBe(true)
    expect((await runLib({ cwd: parent, logLevel: 'silent' })).ok).toBe(true)
    writeFileSync(
      join(dir, 'panda.config.ts'),
      CONFIG_WITH_TOKENS.replace(
        'export default {',
        `export default {
      designSystem: '@acme/ds',`,
      ),
    )

    const result = await runCodegen({ cwd: dir, logLevel: 'silent' })

    expect(result.ok, JSON.stringify(result.diagnostics)).toBe(true)
    expect(readFileSync(join(dir, 'styled-system', 'css', 'css.js'), 'utf8')).not.toContain('@acme/ds/css')
    expect(readFileSync(join(dir, 'styled-system', 'css', 'css.js'), 'utf8')).toContain('createCss')
  })

  it('keeps preset DEFAULT token ownership when the app extends a sibling shade', async () => {
    dir = createFixture(`export default {
      outdir: 'styled-system',
      presets: [{ name: 'brand-preset', theme: {
        tokens: { colors: { brand: { DEFAULT: { value: 'red' }, 500: { value: 'maroon' } } } },
        semanticTokens: { colors: { accent: { DEFAULT: { value: '{colors.brand}' }, 500: { value: 'red' } } } },
      } }],
      theme: { extend: {
        tokens: { colors: { brand: { 500: { value: 'blue' } } } },
        semanticTokens: { colors: { accent: { 500: { value: 'blue' } } } },
      } },
    }`)

    await runCodegen({ cwd: dir, spec: '', logLevel: 'silent' })
    const spec = JSON.parse(readFileSync(join(dir, 'styled-system', 'specs', 'design-system.json'), 'utf8'))
    for (const name of ['brand', 'accent']) {
      expect(spec.sources.entries[spec.tokens[`colors.${name}`].source].name).toBe('brand-preset')
      expect(spec.sources.entries[spec.tokens[`colors.${name}.500`].source].kind).toBe('config')
    }
  })

  it('writes the spec into the outdir with a bare --spec', async () => {
    dir = createFixture(CONFIG_WITH_TOKENS)

    const result = await runCodegen({ cwd: dir, spec: '', logLevel: 'silent' })
    const specPath = join(dir, 'styled-system', 'specs', 'design-system.json')

    expect(result.files).toContain(specPath)
    expect(JSON.parse(readFileSync(specPath, 'utf8')).schemaVersion).toBe(1)
  })

  it('records which config defined each token', async () => {
    dir = createFixture(CONFIG_WITH_TOKENS)

    await runCodegen({ cwd: dir, spec: '', logLevel: 'silent' })
    const spec = JSON.parse(readFileSync(join(dir, 'styled-system', 'specs', 'design-system.json'), 'utf8'))

    expect(spec.sources.entries).toMatchInlineSnapshot(`
      [
        {
          "file": "panda.config.ts",
          "kind": "config",
        },
      ]
    `)
    expect(spec.tokens['colors.brand'].source).toBe(0)
  })

  it('records provenance for --spec=<file> too', async () => {
    dir = createFixture(CONFIG_WITH_TOKENS)

    await runCodegen({ cwd: dir, spec: 'meta.json', logLevel: 'silent' })
    const spec = JSON.parse(readFileSync(join(dir, 'meta.json'), 'utf8'))

    expect(spec.sources.entries).toHaveLength(1)
    expect(spec.tokens['colors.brand'].source).toBe(0)
  })

  it('writes the spec where --spec=<file> says', async () => {
    dir = createFixture(CONFIG_WITH_TOKENS)

    const result = await runCodegen({ cwd: dir, spec: 'meta.json', logLevel: 'silent' })

    expect(result.files).toContain(join(dir, 'meta.json'))
    expect(existsSync(join(dir, 'styled-system', 'specs', 'design-system.json'))).toBe(false)
  })

  it('supports outdir overrides', async () => {
    dir = createFixture()

    await runCodegen({ cwd: dir, outdir: 'system', logLevel: 'silent' })

    expect(readFileSync(join(dir, 'system', 'css', 'css.js'), 'utf8')).toContain('css')
  })

  it('keeps stale outdir files by default', async () => {
    dir = createFixture()

    await runCodegen({ cwd: dir, logLevel: 'silent' })
    writeFileSync(join(dir, 'styled-system', 'stale.mjs'), 'stale')

    await runCodegen({ cwd: dir, logLevel: 'silent' })

    expect(existsSync(join(dir, 'styled-system', 'stale.mjs'))).toBe(true)
  })

  it('--clean removes the outdir before generating', async () => {
    dir = createFixture()

    await runCodegen({ cwd: dir, logLevel: 'silent' })
    writeFileSync(join(dir, 'styled-system', 'stale.mjs'), 'stale')

    await runCodegen({ cwd: dir, clean: true, logLevel: 'silent' })

    expect(existsSync(join(dir, 'styled-system', 'stale.mjs'))).toBe(false)
    expect(readFileSync(join(dir, 'styled-system', 'css', 'css.js'), 'utf8')).toContain('css')
  })

  it('--check passes after generated output exists', async () => {
    dir = createFixture()

    await runCodegen({ cwd: dir, logLevel: 'silent' })

    const result = await runCodegen({ cwd: dir, check: true, logLevel: 'silent' })

    expect(result).toMatchObject({ ok: true, exitCode: 0, missing: [], stale: [] })
  })

  it('--check fails when generated files are stale', async () => {
    dir = createFixture()

    await runCodegen({ cwd: dir, logLevel: 'silent' })

    writeFileSync(join(dir, 'styled-system', 'css', 'css.js'), 'stale')

    const result = await runCodegen({ cwd: dir, check: true, logLevel: 'silent' })

    expect(result.ok).toBe(false)
    expect(result.exitCode).toBe(1)

    expect(result.stale).toContain(join(dir, 'styled-system', 'css', 'css.js'))
  })

  it('--check fails when generated files are missing', async () => {
    dir = createFixture()

    const result = await runCodegen({ cwd: dir, check: true, logLevel: 'silent' })

    expect(result.ok).toBe(false)
    expect(result.exitCode).toBe(1)

    expect(result.missing.some((path) => path.endsWith('css/css.js'))).toBe(true)
  })

  it('emits a failed json envelope when config loading fails', async () => {
    dir = createFixture()

    const logs: string[] = []
    const result = await runCodegen(
      { cwd: dir, config: 'missing.config.ts', json: true },
      { log: (message) => logs.push(message) },
    )
    const payload = JSON.parse(logs[0])

    expect(result).toMatchObject({ ok: false, command: 'codegen', exitCode: 1, files: [], missing: [], stale: [] })

    expect(payload).toMatchObject({
      ok: false,
      command: 'codegen',
      exitCode: 1,
      diagnostics: [
        {
          code: 'config_load_error',
          severity: 'error',
          file: 'missing.config.ts',
        },
      ],
    })
  })
})
