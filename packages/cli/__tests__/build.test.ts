import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runBuild } from '../src'
import { useDispatcher } from '../src/routing'
import { cleanupFixture, createFixture, normalizeOutput, writeSyntaxError } from './helpers'

describe('command routing (useDispatcher)', () => {
  it('routes the default build (no args or leading flags) to the build command', () => {
    expect(useDispatcher([])).toBe(false)
    expect(useDispatcher(['--watch'])).toBe(false)
    expect(useDispatcher(['--outdir', 'system'])).toBe(false)
    expect(useDispatcher(['--cwd', '/some/dir', '--silent'])).toBe(false)
    expect(useDispatcher(['-o', 'styles.css'])).toBe(false)
  })

  it('routes a leading subcommand token to the dispatcher', () => {
    expect(useDispatcher(['codegen'])).toBe(true)
    expect(useDispatcher(['cssgen', '--cwd', '/x'])).toBe(true)
    expect(useDispatcher(['init'])).toBe(true)
    // A typo also goes to the dispatcher so citty rejects it instead of silently building.
    expect(useDispatcher(['frobnicate'])).toBe(true)
  })

  it('routes --help/-h to the dispatcher so subcommands are listed', () => {
    expect(useDispatcher(['--help'])).toBe(true)
    expect(useDispatcher(['-h'])).toBe(true)
    expect(useDispatcher(['codegen', '--help'])).toBe(true)
    expect(useDispatcher(['--watch', '--help'])).toBe(true)
  })
})

describe('build command (default panda)', () => {
  let dir: string | undefined

  afterEach(() => {
    cleanupFixture(dir)
    dir = undefined
  })

  it('runs codegen and cssgen in one pass', async () => {
    dir = createFixture()

    const result = await runBuild({ cwd: dir, silent: true })

    // codegen wrote the styled-system (separator-agnostic so it holds on Windows too)
    expect(result.files.some((path) => path.replace(/\\/g, '/').endsWith('css/css.js'))).toBe(true)
    expect(readFileSync(join(dir, 'styled-system', 'css', 'css.js'), 'utf8')).toContain('css')

    // cssgen wrote styles.css from the parsed source
    expect(result.parsed).toHaveLength(1)
    expect(readFileSync(join(dir, 'styled-system', 'styles.css'), 'utf8')).toContain('red')

    expect(result.ok).toBe(true)
    expect(result.exitCode).toBe(0)
  })

  it('prints a single combined summary line', async () => {
    dir = createFixture()

    const logs: string[] = []
    await runBuild({ cwd: dir }, { log: (message) => logs.push(message) })

    const summaries = logs.filter((line) => line.startsWith('panda: generated'))

    expect(summaries).toHaveLength(1)
    expect(summaries[0]).toContain('generated')
    expect(logs.some((line) => line.startsWith('codegen:') || line.startsWith('cssgen:'))).toBe(false)
  })

  it('records both codegen and css phases in timings', async () => {
    dir = createFixture()

    const result = await runBuild({ cwd: dir, silent: true })

    expect(result.timings).toMatchObject({
      config: expect.any(Number),
      codegen: expect.any(Number),
      parse: expect.any(Number),
      write: expect.any(Number),
    })
  })

  it('supports outdir and outfile overrides', async () => {
    dir = createFixture()

    await runBuild({ cwd: dir, outdir: 'system', outfile: 'panda.css', silent: true })

    expect(readFileSync(join(dir, 'system', 'css', 'css.js'), 'utf8')).toContain('css')
    expect(readFileSync(join(dir, 'panda.css'), 'utf8')).toContain('red')
  })

  it('surfaces parse diagnostics from the css pass', async () => {
    dir = createFixture()
    writeSyntaxError(dir)

    const logs: string[] = []
    const result = await runBuild({ cwd: dir }, { log: (m) => logs.push(m), error: (m) => logs.push(m) })

    expect(result.diagnostics.map(({ code, file, severity }) => ({ code, file, severity }))).toMatchInlineSnapshot(`
      [
        {
          "code": "js_parse_error",
          "file": "App.tsx",
          "severity": "error",
        },
      ]
    `)
    expect(result.ok).toBe(false)
    expect(result.exitCode).toBe(1)
    expect(normalizeOutput(logs.join('\n'), dir)).toContain('error js_parse_error')
  })

  it('--check passes after a clean build', async () => {
    dir = createFixture()

    await runBuild({ cwd: dir, silent: true })

    const result = await runBuild({ cwd: dir, check: true, silent: true })

    expect(result).toMatchObject({ ok: true, exitCode: 0, missing: [], stale: [] })
  })

  it('--check counts every split CSS file in the summary, not just one', async () => {
    dir = createFixture()

    await runBuild({ cwd: dir, splitting: true, silent: true })

    const cssCount = readdirSync(join(dir, 'styled-system'), { recursive: true }).filter((path) =>
      String(path).endsWith('.css'),
    ).length
    expect(cssCount).toBeGreaterThan(1) // splitting emits multiple CSS files

    const logs: string[] = []
    const result = await runBuild({ cwd: dir, splitting: true, check: true }, { log: (m) => logs.push(m) })

    expect(result.ok).toBe(true)
    const summary = logs.find((line) => line.startsWith('panda: checked'))
    const checked = Number(summary?.match(/checked (\d+) files/)?.[1])
    // codegen files + every split CSS file — guards against the old hardcoded "+1"
    expect(checked).toBe(result.files.length + cssCount)
  })

  it('--check fails when output is missing', async () => {
    dir = createFixture()

    const result = await runBuild({ cwd: dir, check: true, silent: true })

    expect(result.ok).toBe(false)
    expect(result.exitCode).toBe(1)
    expect(result.missing.length).toBeGreaterThan(0)
  })

  it('--clean wipes the outdir before generating', async () => {
    dir = createFixture()

    await runBuild({ cwd: dir, silent: true })
    writeFileSync(join(dir, 'styled-system', 'stale.mjs'), 'stale')

    await runBuild({ cwd: dir, clean: true, silent: true })

    expect(existsSync(join(dir, 'styled-system', 'stale.mjs'))).toBe(false)
    // CSS is still regenerated after the clean.
    expect(readFileSync(join(dir, 'styled-system', 'styles.css'), 'utf8')).toContain('red')
  })
})
