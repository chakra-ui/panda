import { EventEmitter } from 'node:events'
import { describe, expect, test, vi } from 'vitest'
import { watchProcessLifecycle, type ProcessLike } from '../src/server'

function createFakeProcess() {
  const stdin = new EventEmitter()
  const stdout = Object.assign(new EventEmitter(), { write: vi.fn((_chunk: string) => true) })
  const stderr = Object.assign(new EventEmitter(), { write: vi.fn((_chunk: string) => true) })
  const proc = Object.assign(new EventEmitter(), { stdin, stdout, stderr })
  return { proc: proc as unknown as ProcessLike, raw: proc, stdin, stdout, stderr }
}

function setup() {
  const fake = createFakeProcess()
  const server = { close: vi.fn().mockResolvedValue(undefined) }
  const exit = vi.fn()
  watchProcessLifecycle(server, { process: fake.proc, exit })
  return { ...fake, server, exit }
}

describe('watchProcessLifecycle', () => {
  test('exits cleanly when the host closes stdin', () => {
    const { stdin, server, exit } = setup()

    stdin.emit('end')

    expect(exit).toHaveBeenCalledWith(0)
    expect(server.close).toHaveBeenCalledOnce()
  })

  test('exits cleanly on SIGTERM', () => {
    const { raw, server, exit } = setup()

    raw.emit('SIGTERM')

    expect(exit).toHaveBeenCalledWith(0)
    expect(server.close).toHaveBeenCalledOnce()
  })

  test('exits on a broken pipe instead of recursing', () => {
    const { stdout, exit } = setup()

    stdout.emit('error', Object.assign(new Error('write EPIPE'), { code: 'EPIPE' }))

    expect(exit).toHaveBeenCalledWith(0)
  })

  test('ignores non-EPIPE stream errors', () => {
    const { stdout, exit } = setup()

    stdout.emit('error', Object.assign(new Error('boom'), { code: 'ECONNRESET' }))

    expect(exit).not.toHaveBeenCalled()
  })

  test('logs and exits non-zero on an uncaught exception', () => {
    const { raw, stderr, exit } = setup()

    raw.emit('uncaughtException', new Error('kaboom'))

    expect(stderr.write).toHaveBeenCalledOnce()
    expect(stderr.write.mock.calls[0][0]).toContain('uncaught exception')
    expect(exit).toHaveBeenCalledWith(1)
  })

  test('exits non-zero on an unhandled rejection', () => {
    const { raw, exit } = setup()

    raw.emit('unhandledRejection', new Error('nope'))

    expect(exit).toHaveBeenCalledWith(1)
  })

  test('still exits when writing the error to stderr itself fails', () => {
    const fake = createFakeProcess()
    fake.stderr.write.mockImplementation(() => {
      throw Object.assign(new Error('write EPIPE'), { code: 'EPIPE' })
    })
    const server = { close: vi.fn().mockResolvedValue(undefined) }
    const exit = vi.fn()
    watchProcessLifecycle(server, { process: fake.proc, exit })

    expect(() => fake.raw.emit('uncaughtException', new Error('kaboom'))).not.toThrow()
    expect(exit).toHaveBeenCalledWith(1)
  })

  test('exits only once even if multiple signals fire', () => {
    const { stdin, raw, server, exit } = setup()

    stdin.emit('end')
    raw.emit('uncaughtException', new Error('late'))
    stdin.emit('close')

    expect(exit).toHaveBeenCalledOnce()
    expect(server.close).toHaveBeenCalledOnce()
  })
})
