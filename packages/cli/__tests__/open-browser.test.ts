// @vitest-environment node
import { EventEmitter } from 'node:events'
import type { spawn } from 'node:child_process'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { browserOpener, openBrowser } from '../src/open-browser'

const URL = 'http://localhost:6420/?token=abc'

function fakeSpawn(behave: (child: EventEmitter) => void) {
  const calls: unknown[][] = []
  const run = ((...args: unknown[]) => {
    calls.push(args)
    const child = Object.assign(new EventEmitter(), { unref: vi.fn() })
    queueMicrotask(() => behave(child))
    return child
  }) as unknown as typeof spawn
  return { run, calls }
}

describe('browserOpener', () => {
  it('uses open on macOS', () => {
    expect(browserOpener(URL, {}, 'darwin')).toEqual({ command: 'open', args: [URL] })
  })

  it('opens the browser named in BROWSER on macOS', () => {
    expect(browserOpener(URL, { BROWSER: 'Firefox' }, 'darwin')).toEqual({
      command: 'open',
      args: ['-a', 'Firefox', URL],
    })
  })

  it('quotes the URL for cmd on Windows', () => {
    expect(browserOpener(URL, {}, 'win32')).toEqual({
      command: 'cmd',
      args: ['/c', 'start', '""', `"${URL}"`],
      verbatim: true,
    })
  })

  it('uses wslview inside WSL', () => {
    expect(browserOpener(URL, { WSL_DISTRO_NAME: 'Ubuntu' }, 'linux')).toEqual({ command: 'wslview', args: [URL] })
  })

  it('uses xdg-open on a Linux desktop', () => {
    expect(browserOpener(URL, { WAYLAND_DISPLAY: 'wayland-0' }, 'linux')).toEqual({
      command: 'xdg-open',
      args: [URL],
    })
  })

  it('runs the command in BROWSER on Linux', () => {
    expect(browserOpener(URL, { BROWSER: 'firefox' }, 'linux')).toEqual({ command: 'firefox', args: [URL] })
  })

  it("doesn't try on Linux without a display, like over SSH", () => {
    expect(browserOpener(URL, {}, 'linux')).toBeUndefined()
  })

  it("doesn't try when BROWSER=none", () => {
    expect(browserOpener(URL, { BROWSER: 'none' }, 'darwin')).toBeUndefined()
  })
})

describe('openBrowser', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.useRealTimers()
  })

  it('reports success when the opener exits cleanly', async () => {
    vi.stubEnv('BROWSER', 'test-browser')
    const { run, calls } = fakeSpawn((child) => child.emit('exit', 0))

    expect(await openBrowser(URL, run)).toBe(true)
    expect(calls).toHaveLength(1)
  })

  it('reports failure when the opener exits with an error, like xdg-open without a desktop', async () => {
    vi.stubEnv('BROWSER', 'test-browser')
    const { run } = fakeSpawn((child) => child.emit('exit', 3))

    expect(await openBrowser(URL, run)).toBe(false)
  })

  it('reports failure when the opener is not installed', async () => {
    vi.stubEnv('BROWSER', 'test-browser')
    const { run } = fakeSpawn((child) => child.emit('error', new Error('spawn test-browser ENOENT')))

    expect(await openBrowser(URL, run)).toBe(false)
  })

  it('treats a browser that keeps running as opened', async () => {
    vi.useFakeTimers()
    vi.stubEnv('BROWSER', 'test-browser')
    const { run } = fakeSpawn(() => {})

    const opened = openBrowser(URL, run)
    await vi.advanceTimersByTimeAsync(3000)
    expect(await opened).toBe(true)
  })

  it("doesn't start anything when there's no browser to open", async () => {
    vi.stubEnv('BROWSER', 'none')
    const { run, calls } = fakeSpawn(() => {})

    expect(await openBrowser(URL, run)).toBe(false)
    expect(calls).toHaveLength(0)
  })
})
