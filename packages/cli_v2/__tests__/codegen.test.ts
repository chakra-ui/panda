import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runCodegen } from '../src'
import { cleanupFixture, createFixture } from './helpers'

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

    expect(result.files.some((path) => path.endsWith('css/css.mjs'))).toBe(true)
    expect(readFileSync(join(dir, 'styled-system', 'css', 'css.mjs'), 'utf8')).toContain('css')

    expect(logs[0]).toContain('codegen: wrote')
  })

  it('supports outdir overrides', async () => {
    dir = createFixture()

    await runCodegen({ cwd: dir, outdir: 'system', silent: true })

    expect(readFileSync(join(dir, 'system', 'css', 'css.mjs'), 'utf8')).toContain('css')
  })

  it('--check passes after generated output exists', async () => {
    dir = createFixture()

    await runCodegen({ cwd: dir, silent: true })

    const result = await runCodegen({ cwd: dir, check: true, silent: true })

    expect(result).toMatchObject({ ok: true, exitCode: 0, missing: [], stale: [] })
  })

  it('--check fails when generated files are stale', async () => {
    dir = createFixture()

    await runCodegen({ cwd: dir, silent: true })

    writeFileSync(join(dir, 'styled-system', 'css', 'css.mjs'), 'stale')

    const result = await runCodegen({ cwd: dir, check: true, silent: true })

    expect(result.ok).toBe(false)
    expect(result.exitCode).toBe(1)

    expect(result.stale).toContain(join(dir, 'styled-system', 'css', 'css.mjs'))
  })

  it('--check fails when generated files are missing', async () => {
    dir = createFixture()

    const result = await runCodegen({ cwd: dir, check: true, silent: true })

    expect(result.ok).toBe(false)
    expect(result.exitCode).toBe(1)

    expect(result.missing.some((path) => path.endsWith('css/css.mjs'))).toBe(true)
  })
})
