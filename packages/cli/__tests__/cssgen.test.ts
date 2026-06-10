import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Diagnostic } from '@pandacss/compiler'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { runCssgen, writeCssgenOutput } from '../src'
import {
  cleanupFixture,
  createFixture,
  EMPTY_CONFIG,
  normalizeOutput,
  writeSyntaxError,
  writeWarningSource,
} from './helpers'

describe('cssgen command', () => {
  let dir: string | undefined

  afterEach(() => {
    cleanupFixture(dir)
    dir = undefined
  })

  it('writes styles.css after parsing a css call', async () => {
    dir = createFixture()

    const result = await runCssgen({ cwd: dir, silent: true })

    expect(result.parsed).toHaveLength(1)

    expect(readFileSync(join(dir, 'styled-system', 'styles.css'), 'utf8')).toContain('red')
  })

  it('reports zero parsed files when no sources match', async () => {
    dir = createFixture(EMPTY_CONFIG)

    const result = await runCssgen({ cwd: dir, silent: true })

    expect(result.parsed).toEqual([])

    expect(result.timings).toMatchObject({
      config: expect.any(Number),
      parse: expect.any(Number),
      write: expect.any(Number),
    })
  })

  it('renders human diagnostics with severity, code, and message', async () => {
    dir = createFixture()
    writeSyntaxError(dir)

    const logs: string[] = []
    const result = await runCssgen(
      { cwd: dir },
      { log: (message) => logs.push(message), error: (message) => logs.push(message) },
    )

    const diagnostic = result.diagnostics[0]

    expect(result.diagnostics.map(({ code, file, severity }) => ({ code, file, severity }))).toMatchInlineSnapshot(`
      [
        {
          "code": "js_parse_error",
          "file": "App.tsx",
          "severity": "error",
        },
      ]
    `)

    expect(normalizeOutput(logs.join('\n'), dir)).toContain(`${diagnostic.severity} ${diagnostic.code}`)
  })

  it('stabilizes diagnostic file paths in json output', async () => {
    dir = createFixture()
    writeSyntaxError(dir)

    const logs: string[] = []

    await runCssgen({ cwd: dir, format: 'json' }, { log: (message) => logs.push(message) })

    const payload = JSON.parse(logs[0]) as { diagnostics: Diagnostic[] }

    expect(payload.diagnostics.map(({ code, file, severity }) => ({ code, file, severity }))).toMatchInlineSnapshot(`
      [
        {
          "code": "js_parse_error",
          "file": "App.tsx",
          "severity": "error",
        },
      ]
    `)
  })

  it('renders pretty diagnostics with source context when available', async () => {
    dir = createFixture()
    writeSyntaxError(dir)

    const logs: string[] = []

    await runCssgen(
      { cwd: dir, format: 'pretty' },
      { log: (message) => logs.push(message), error: (message) => logs.push(message) },
    )

    expect(normalizeOutput(logs.join('\n'), dir)).toMatchInlineSnapshot(`
      "cssgen: parsed 1 files, wrote 274 bytes to <cwd>/styled-system/styles.css, diagnostics: 1
      error js_parse_error: Unexpected token
        ┌─ App.tsx:1:48
        │
      1 │ import { css } from '@panda/css'; css({ color: 
        │                                                ^"
    `)
  })

  it('renders GitHub Actions diagnostics', async () => {
    dir = createFixture()
    writeSyntaxError(dir)

    const logs: string[] = []

    await runCssgen(
      { cwd: dir, format: 'github' },
      { log: (message) => logs.push(message), error: (message) => logs.push(message) },
    )

    expect(logs.join('\n')).toMatchInlineSnapshot(
      `"::error file=App.tsx,line=1,col=48,title=js_parse_error::Unexpected token"`,
    )
  })

  it('supports quiet output and max warning policy', async () => {
    dir = createFixture()
    writeWarningSource(dir)

    const logs: string[] = []

    const quiet = await runCssgen({ cwd: dir, quiet: true }, { log: (message) => logs.push(message) })
    const strict = await runCssgen({ cwd: dir, silent: true, maxWarnings: 0 })

    expect(quiet.diagnostics.map(({ code, file, severity }) => ({ code, file, severity }))).toMatchInlineSnapshot(`
      [
        {
          "code": "panda_call_unextractable",
          "file": "App.tsx",
          "severity": "warning",
        },
      ]
    `)

    expect(normalizeOutput(logs.join('\n'), dir)).toMatchInlineSnapshot(
      `"cssgen: parsed 1 files, wrote 274 bytes to <cwd>/styled-system/styles.css, diagnostics: 1"`,
    )

    expect({ exitCode: strict.exitCode, ok: strict.ok }).toMatchInlineSnapshot(`
      {
        "exitCode": 1,
        "ok": false,
      }
    `)
  })

  it('supports outfile overrides', async () => {
    dir = createFixture()

    await runCssgen({ cwd: dir, outfile: 'panda.css', silent: true })

    expect(readFileSync(join(dir, 'panda.css'), 'utf8')).toContain('red')
  })

  it('writes split stylesheet output', async () => {
    dir = createFixture()

    const stylesFile = join(dir, 'styled-system', 'styles.css')
    const utilitiesFile = join(dir, 'styled-system', 'styles', 'utilities.css')

    const result = await runCssgen({ cwd: dir, splitting: true, silent: true })

    expect(result.outfile).toBe(stylesFile)
    expect(readFileSync(stylesFile, 'utf8')).toContain("@import './styles/utilities.css';")
    expect(readFileSync(utilitiesFile, 'utf8')).toContain('red')
  })

  it('--check passes after generated CSS exists', async () => {
    dir = createFixture()

    await runCssgen({ cwd: dir, silent: true })

    const result = await runCssgen({ cwd: dir, check: true, silent: true })

    expect(result).toMatchObject({ ok: true, exitCode: 0, missing: [], stale: [] })
  })

  it('--check fails when CSS output is stale', async () => {
    dir = createFixture()

    const stylesFile = join(dir, 'styled-system', 'styles.css')

    await runCssgen({ cwd: dir, silent: true })

    writeFileSync(stylesFile, 'stale')

    const result = await runCssgen({ cwd: dir, check: true, silent: true })

    expect(result.ok).toBe(false)
    expect(result.exitCode).toBe(1)

    expect(result.stale).toContain(stylesFile)
  })

  it('--check fails when CSS output is missing', async () => {
    dir = createFixture()

    const stylesFile = join(dir, 'styled-system', 'styles.css')

    const result = await runCssgen({ cwd: dir, check: true, silent: true })

    expect(result.ok).toBe(false)
    expect(result.exitCode).toBe(1)

    expect(result.missing).toEqual([stylesFile])
  })

  it('watch emission keeps previous styles when a source file changes', async () => {
    dir = createFixture()

    const appFile = join(dir, 'App.tsx')
    const stylesFile = join(dir, 'styled-system', 'styles.css')

    writeFileSync(appFile, "import { css } from '@panda/css'; css({ padding: '4px' })")

    const result = await runCssgen({ cwd: dir, silent: true })
    const { driver } = result

    if (!driver) throw new Error('expected cssgen result to include a driver')

    expect(result.parsed.map((report) => report.path)).toEqual([appFile])
    expect(driver.compiler.atoms().map((atom) => atom.value)).toEqual(['4px'])

    const parseFiles = vi.spyOn(driver, 'parseFiles')

    // Watch path: additive refresh — old atoms stay, new ones append.
    driver.applyChange({
      path: appFile,
      kind: 'change',
      content: "import { css } from '@panda/css'; css({ padding: '8px' })",
    })

    expect(
      driver.compiler
        .atoms()
        .map((atom) => atom.value)
        .sort(),
    ).toEqual(['4px', '8px'])

    const ctx = {
      driver,
      cwd: dir,
      outdir: join(dir, 'styled-system'),
      output: { log: () => {} },
    }

    // Re-emit CSS from the existing driver — no full re-parse.
    await writeCssgenOutput(ctx, stylesFile, { cwd: dir, silent: true }, result.parsed)

    const css = readFileSync(stylesFile, 'utf8')

    expect(parseFiles).not.toHaveBeenCalled()
    expect(css).toContain('4px')
    expect(css).toContain('8px')
  })
})
