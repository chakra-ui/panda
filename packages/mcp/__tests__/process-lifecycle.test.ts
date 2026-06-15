import { EventEmitter } from 'node:events'
import { describe, expect, test, vi } from 'vitest'
import { exitOnDisconnect } from '../src/server'

function setup() {
  const stdin = new EventEmitter()
  const signals = new EventEmitter()
  const exit = vi.fn()
  exitOnDisconnect({
    stdin,
    on: (event, listener) => signals.on(event, listener),
    exit,
  })
  return { stdin, signals, exit }
}

describe('exitOnDisconnect', () => {
  test('exits when the host ends stdin', () => {
    const { stdin, exit } = setup()
    stdin.emit('end')
    expect(exit).toHaveBeenCalledWith(0)
  })

  test('exits when stdin closes', () => {
    const { stdin, exit } = setup()
    stdin.emit('close')
    expect(exit).toHaveBeenCalledWith(0)
  })

  test('exits on SIGINT', () => {
    const { signals, exit } = setup()
    signals.emit('SIGINT')
    expect(exit).toHaveBeenCalledWith(0)
  })

  test('exits on SIGTERM', () => {
    const { signals, exit } = setup()
    signals.emit('SIGTERM')
    expect(exit).toHaveBeenCalledWith(0)
  })

  test('exits on SIGHUP', () => {
    const { signals, exit } = setup()
    signals.emit('SIGHUP')
    expect(exit).toHaveBeenCalledWith(0)
  })
})
