import { afterEach, describe, expect, it } from 'vitest'
import { runInfo } from '../src'
import { cleanupFixture, createFixture } from './helpers'

describe('info command', () => {
  let dir: string | undefined

  afterEach(() => {
    cleanupFixture(dir)
    dir = undefined
  })

  it('returns stable json keys', async () => {
    dir = createFixture()

    const logs: string[] = []
    const result = await runInfo({ cwd: dir, json: true }, { log: (message) => logs.push(message) })

    expect(result).toMatchObject({
      ok: true,
      command: 'info',
      exitCode: 0,
      diagnostics: [],
      sourceCount: 1,
    })

    expect(JSON.parse(logs[0])).toMatchObject({ ok: true, command: 'info', sourceCount: 1, diagnostics: [] })
  })

  it('--include replaces the reported source globs', async () => {
    // info reports the include globs (sourceCount = glob count), so an override
    // with two globs replaces the config's single default glob.
    dir = createFixture()

    const base = await runInfo({ cwd: dir })
    const overridden = await runInfo({ cwd: dir, include: ['a/**/*.tsx', 'b/**/*.tsx'] })

    expect(base.sourceCount).toBe(1)
    expect(overridden.sourceCount).toBe(2)
  })

  it('includes timings in json output', async () => {
    dir = createFixture()

    const logs: string[] = []

    await runInfo({ cwd: dir, json: true }, { log: (message) => logs.push(message) })

    expect(JSON.parse(logs[0]).timings).toMatchObject({ config: expect.any(Number) })
  })
})
