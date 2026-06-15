import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runDebug } from '../src'
import { cleanupFixture, createFixture, writeSyntaxError } from './helpers'

describe('debug command', () => {
  let dir: string | undefined

  afterEach(() => {
    cleanupFixture(dir)
    dir = undefined
  })

  it('writes info, config, per-file extraction, and project css', async () => {
    dir = createFixture()

    const result = await runDebug({ cwd: dir, silent: true })
    const debugDir = join(dir, 'styled-system', 'debug')

    expect(result.sourceCount).toBe(1)
    expect(existsSync(join(debugDir, 'info.json'))).toBe(true)
    expect(existsSync(join(debugDir, 'config.json'))).toBe(true)
    expect(existsSync(join(debugDir, 'App.tsx.extract.json'))).toBe(true)
    expect(readFileSync(join(debugDir, 'styles.css'), 'utf8')).toContain('red')

    const info = JSON.parse(readFileSync(join(debugDir, 'info.json'), 'utf8'))
    expect(info).toMatchObject({ platform: process.platform, sourceCount: 1 })

    // the per-file extraction captures the css() call site
    const extract = JSON.parse(readFileSync(join(debugDir, 'App.tsx.extract.json'), 'utf8'))
    expect(extract.calls.length).toBeGreaterThan(0)
  })

  it('--only-config skips per-file extraction and css', async () => {
    dir = createFixture()

    const result = await runDebug({ cwd: dir, onlyConfig: true, silent: true })
    const debugDir = join(dir, 'styled-system', 'debug')

    expect(existsSync(join(debugDir, 'config.json'))).toBe(true)
    expect(existsSync(join(debugDir, 'App.tsx.extract.json'))).toBe(false)
    expect(existsSync(join(debugDir, 'styles.css'))).toBe(false)
    expect(result.files.every((path) => !path.endsWith('styles.css'))).toBe(true)
  })

  it('--dry prints the dump without writing files', async () => {
    dir = createFixture()

    const logs: string[] = []
    const result = await runDebug({ cwd: dir, dry: true }, { log: (m) => logs.push(m) })
    const debugDir = join(dir, 'styled-system', 'debug')

    expect(existsSync(debugDir)).toBe(false)
    expect(result.outdir).toBeUndefined()
    expect(logs.join('\n')).toContain('--- config.json ---')
    expect(logs.join('\n')).toContain('--- App.tsx.extract.json ---')
  })

  it('supports a custom --outdir', async () => {
    dir = createFixture()

    await runDebug({ cwd: dir, outdir: 'debug-out', silent: true })

    expect(existsSync(join(dir, 'debug-out', 'config.json'))).toBe(true)
  })

  it('surfaces extraction diagnostics', async () => {
    dir = createFixture()
    writeSyntaxError(dir)

    const result = await runDebug({ cwd: dir, silent: true })

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
  })
})
