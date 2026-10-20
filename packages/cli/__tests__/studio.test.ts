// @vitest-environment node
import { writeFileSync } from 'node:fs'
import { createServer, request, type Server } from 'node:http'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runStudio } from '../src'
import { resolveStudioUrl } from '../src/commands/studio'
import type { StudioResult } from '../src/schema'
import { runCli } from './cli-runner'
import { cleanupFixture, createFixture, CONFIG_WITH_TOKENS } from './helpers'

const STUDIO_URL = 'http://localhost:3311/view'
const TOKEN = 'test-token'

interface Message {
  type: string
  [key: string]: unknown
}

function captureOutput() {
  const lines: string[] = []
  return { lines, sink: { log: (line: string) => lines.push(line), error: (line: string) => lines.push(line) } }
}

/** Reads Server-Sent Events from the studio stream, one `data:` message at a time. */
async function openStream(port: number, token = TOKEN) {
  const controller = new AbortController()
  const response = await fetch(`http://127.0.0.1:${port}/events?token=${token}`, { signal: controller.signal })
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  return {
    status: response.status,
    async next(count: number): Promise<Message[]> {
      const messages: Message[] = []
      while (messages.length < count) {
        let boundary = buffer.indexOf('\n\n')
        while (boundary >= 0 && messages.length < count) {
          const chunk = buffer.slice(0, boundary)
          buffer = buffer.slice(boundary + 2)
          if (chunk.startsWith('data: ')) messages.push(JSON.parse(chunk.slice(6)))
          boundary = buffer.indexOf('\n\n')
        }
        if (messages.length >= count) break
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
      }
      return messages
    },
    close: () => controller.abort(),
  }
}

function requestWithHost(port: number, host: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const req = request({ host: '127.0.0.1', port, path: `/events?token=${TOKEN}`, headers: { host } }, (res) => {
      res.resume()
      resolve(res.statusCode ?? 0)
    })
    req.on('error', reject)
    req.end()
  })
}

function occupyPort(): Promise<{ server: Server; port: number }> {
  return new Promise((resolve) => {
    const server = createServer()
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      resolve({ server, port: typeof address === 'object' && address ? address.port : 0 })
    })
  })
}

describe('cli studio', () => {
  let dir: string | undefined
  let studio: StudioResult | undefined
  let busy: Server | undefined

  afterEach(async () => {
    await studio?.stop?.()
    studio = undefined
    busy?.close()
    busy = undefined
    cleanupFixture(dir)
    dir = undefined
  })

  it('serves a page that frames Studio once you open the printed link', async () => {
    dir = createFixture(CONFIG_WITH_TOKENS)
    studio = await runStudio({ cwd: dir, logLevel: 'silent' }, captureOutput().sink, {
      port: 0,
      token: TOKEN,
      studioUrl: STUDIO_URL,
    })

    expect(studio.ok).toBe(true)
    expect(studio.url).toBe(`http://localhost:${studio.port}/?token=${TOKEN}`)

    const page = await (await fetch(`http://127.0.0.1:${studio.port}/?token=${TOKEN}`)).text()
    expect(page).toContain(`<iframe id="studio" src="${STUDIO_URL}"`)
    expect(page).toContain('"http://localhost:3311"')
  })

  it('asks for the printed link when the page is opened without its token', async () => {
    dir = createFixture(CONFIG_WITH_TOKENS)
    studio = await runStudio({ cwd: dir, logLevel: 'silent' }, captureOutput().sink, { port: 0, token: TOKEN })

    const page = await (await fetch(`http://127.0.0.1:${studio.port}/`)).text()
    expect(page).not.toContain('<iframe')
    expect(page).toContain('Open the link that <code>panda studio</code> printed')
  })

  it('streams the design system, the sources and the usage report to a connected Studio', async () => {
    dir = createFixture(CONFIG_WITH_TOKENS)
    studio = await runStudio({ cwd: dir, logLevel: 'silent' }, captureOutput().sink, { port: 0, token: TOKEN })

    const stream = await openStream(studio.port!)
    const [system, sources, report] = await stream.next(3)
    stream.close()

    expect([system!.type, sources!.type, report!.type]).toEqual(['system', 'sources', 'report'])
    expect(JSON.parse(system!.spec as string).tokens).toBeDefined()
    expect((sources!.files as Array<{ path: string; text: string }>).map((file) => file.path)).toEqual([
      join(dir, 'App.tsx'),
    ])
    expect((report!.report as { sourceCount: number }).sourceCount).toBe(1)
  })

  it('pushes the new code and report when you save a file', async () => {
    dir = createFixture(CONFIG_WITH_TOKENS)
    const { lines, sink } = captureOutput()
    studio = await runStudio({ cwd: dir }, sink, { port: 0, token: TOKEN })

    const stream = await openStream(studio.port!)
    await stream.next(3)

    // macOS FSEvents drops writes made right after the watcher subscribes.
    await new Promise((resolve) => setTimeout(resolve, 500))
    const updated = "import { css } from '@panda/css'; css({ color: 'brand' })"
    writeFileSync(join(dir, 'App.tsx'), updated)
    const [source, report] = await stream.next(2)
    stream.close()

    expect(source).toEqual({ type: 'source', path: join(dir, 'App.tsx'), text: updated })
    expect(report!.type).toBe('report')
    expect(lines).toContain('studio: Studio connected')
    expect(lines.some((line) => /^studio: updated App\.tsx \(\d+ms\)$/.test(line))).toBe(true)
  }, 15_000)

  it('rejects the event stream from a tab opened by an earlier run', async () => {
    dir = createFixture(CONFIG_WITH_TOKENS)
    const { lines, sink } = captureOutput()
    studio = await runStudio({ cwd: dir }, sink, { port: 0, token: TOKEN })

    const stream = await openStream(studio.port!, 'stale-token')
    stream.close()

    expect(stream.status).toBe(401)
    expect(lines).toContain(
      'studio: rejected a connection with an invalid token (a tab left over from an earlier run?)',
    )
  })

  it('refuses requests that arrive under another host name', async () => {
    dir = createFixture(CONFIG_WITH_TOKENS)
    studio = await runStudio({ cwd: dir, logLevel: 'silent' }, captureOutput().sink, { port: 0, token: TOKEN })

    expect(await requestWithHost(studio.port!, 'attacker.example')).toBe(403)
  })

  it('moves to the next port when the default one is taken', async () => {
    dir = createFixture(CONFIG_WITH_TOKENS)
    const taken = await occupyPort()
    busy = taken.server
    const { lines, sink } = captureOutput()
    studio = await runStudio({ cwd: dir }, sink, { port: taken.port, token: TOKEN })

    expect(studio.ok).toBe(true)
    expect(studio.port).toBeGreaterThan(taken.port)
    expect(lines).toContain(`studio: port ${taken.port} is in use, using ${studio.port}`)
  })

  it('stops when the port you chose is taken', async () => {
    dir = createFixture(CONFIG_WITH_TOKENS)
    const taken = await occupyPort()
    busy = taken.server
    studio = await runStudio({ cwd: dir, logLevel: 'silent', port: String(taken.port) }, captureOutput().sink, {
      port: taken.port,
      token: TOKEN,
    })

    expect(studio.ok).toBe(false)
    expect(studio.diagnostics.map((diagnostic) => diagnostic.code)).toContain('studio_port_in_use')
  })

  it('opens Studio on the Tokens page', () => {
    expect(resolveStudioUrl(undefined)).toEqual({ ok: true, url: 'https://studio.panda-css.com/view' })
  })

  it('opens a local Studio on the Tokens page too', () => {
    expect(resolveStudioUrl('http://localhost:3311')).toEqual({ ok: true, url: 'http://localhost:3311/view' })
  })

  it('refuses --json because studio keeps running', () => {
    const result = runCli(['studio', '--json'])

    expect(result.exitCode).toBe(2)
    expect(result.stderr).toContain("studio: --json isn't supported because studio is a long-running server.")
  })

  it('refuses a Studio URL that would send your code to another site', () => {
    const result = runCli(['studio', '--studio-url', 'http://example.com'])

    expect(result.exitCode).toBe(2)
    expect(result.stderr).toContain(
      'studio: --studio-url must be an https URL or http://localhost:<port> (got "http://example.com")',
    )
  })

  it('lists its options in --help', () => {
    const result = runCli(['studio', '--help'])

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('Open Panda Studio in your browser, live-connected to this project')
    expect(result.stdout).toContain('--port')
    expect(result.stdout).toContain('--no-open')
    expect(result.stdout).not.toContain('--json')
  })
})
