import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runDoctor } from '../src'
import { cleanupFixture, createFixture } from './helpers'

describe('doctor command', () => {
  let dir: string | undefined

  afterEach(() => {
    cleanupFixture(dir)
    dir = undefined
  })

  it('succeeds for a valid config', async () => {
    dir = createFixture()

    const logs: string[] = []
    const result = await runDoctor({ cwd: dir }, { log: (message) => logs.push(message) })

    expect(result).toMatchObject({ ok: true, command: 'doctor', exitCode: 0, diagnosticCount: 0, errors: 0 })

    expect(logs[0]).toBe('doctor: ok (0 diagnostics)')
  })

  it('--json emits the command result envelope', async () => {
    dir = createFixture()

    const logs: string[] = []

    await runDoctor({ cwd: dir, json: true }, { log: (message) => logs.push(message) })

    expect(JSON.parse(logs[0])).toMatchObject({
      ok: true,
      command: 'doctor',
      exitCode: 0,
      diagnostics: [],
    })
  })

  it('prints debug phase timings for human output', async () => {
    dir = createFixture()

    const logs: string[] = []

    await runDoctor({ cwd: dir, logLevel: 'debug' }, { log: (message) => logs.push(message) })

    expect(logs.join('\n')).toContain('doctor: timings')

    expect(logs.join('\n')).toContain('config:')
  })

  it('tees human output to a logfile', async () => {
    dir = createFixture()

    const logs: string[] = []

    await runDoctor({ cwd: dir, logfile: 'panda.log' }, { log: (message) => logs.push(message) })

    expect(logs.join('\n')).toContain('doctor: ok')

    expect(readFileSync(join(dir, 'panda.log'), 'utf8')).toContain('doctor: ok')
  })

  it('reports trace lifecycle messages in debug mode', async () => {
    dir = createFixture()

    const logs: string[] = []

    await runDoctor({ cwd: dir, trace: true, logLevel: 'debug' }, { log: (message) => logs.push(message) })

    expect(logs.some((message) => message.startsWith('trace: '))).toBe(true)
  })

  it('reports config load failures as diagnostics', async () => {
    dir = createFixture()

    const logs: string[] = []
    const result = await runDoctor(
      { cwd: dir, config: 'missing.config.ts', format: 'github' },
      { log: (message) => logs.push(message), error: (message) => logs.push(message) },
    )

    expect(result).toMatchObject({
      ok: false,
      command: 'doctor',
      exitCode: 1,
      diagnosticCount: 1,
      errors: 1,
    })

    expect(result.diagnostics[0]).toMatchObject({
      code: 'config_load_error',
      severity: 'error',
      file: 'missing.config.ts',
    })

    expect(logs.join('\n')).toContain('::error file=missing.config.ts,title=config_load_error::')
    expect(logs.join('\n')).toContain('Cannot resolve config file missing.config.ts')
  })
})
