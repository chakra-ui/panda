import { afterEach, describe, expect, it } from 'vitest'
import { runInspect } from '../src'
import { cleanupFixture, createFixture } from './helpers'

describe('inspect command', () => {
  let dir: string | undefined

  afterEach(() => {
    cleanupFixture(dir)
    dir = undefined
  })

  it('returns stable json keys', async () => {
    dir = createFixture()

    const logs: string[] = []
    const result = await runInspect({ cwd: dir, json: true }, { log: (message) => logs.push(message) })

    expect(result).toMatchObject({
      ok: true,
      command: 'inspect',
      exitCode: 0,
      diagnostics: [],
      sourceCount: 1,
    })

    expect(JSON.parse(logs[0])).toMatchObject({ ok: true, command: 'inspect', sourceCount: 1, diagnostics: [] })
  })

  it('includes timings in json output', async () => {
    dir = createFixture()

    const logs: string[] = []

    await runInspect({ cwd: dir, json: true }, { log: (message) => logs.push(message) })

    expect(JSON.parse(logs[0]).timings).toMatchObject({ config: expect.any(Number) })
  })
})
