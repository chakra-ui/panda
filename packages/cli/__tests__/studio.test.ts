// @vitest-environment node
import { createServer, type Server } from 'node:http'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { openSpec, type SealedSpec } from '@pandacss/compiler-shared'
import { runCodegen, runStudio } from '../src'
import { CONFIG_WITH_TOKENS, cleanupFixture, createFixture } from './helpers'

let server: Server | undefined
let dir: string | undefined

afterEach(() => {
  server?.close()
  server = undefined
  cleanupFixture(dir)
  dir = undefined
  vi.unstubAllEnvs()
})

async function fakeStudio(status = 200) {
  const received: SealedSpec[] = []
  server = createServer((req, res) => {
    let body = ''
    req.on('data', (chunk) => (body += chunk))
    req.on('end', () => {
      received.push(JSON.parse(body))
      res.writeHead(status, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ id: 'abcdefghijklmnop' }))
    })
  })
  await new Promise<void>((resolve) => server!.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as { port: number }
  vi.stubEnv('PANDA_STUDIO_URL', `http://127.0.0.1:${port}`)
  return { received, origin: `http://127.0.0.1:${port}` }
}

describe('studio command', () => {
  it('sends the encrypted spec and opens the studio', async () => {
    dir = createFixture(CONFIG_WITH_TOKENS)
    const { received, origin } = await fakeStudio()
    const open = vi.fn()
    const logs: string[] = []

    const result = await runStudio({ cwd: dir }, { log: (message) => logs.push(message) }, open)

    expect(result.ok).toBe(true)
    expect(result.url).toMatch(new RegExp(`^${origin}/view\\?h=abcdefghijklmnop#k=[\\w-]+$`))
    expect(open).toHaveBeenCalledWith(result.url)
    expect(logs.join('\n')).toContain(result.url)

    await runCodegen({ cwd: dir, spec: true, logLevel: 'silent' })
    const written = readFileSync(join(dir, 'styled-system', 'specs', 'design-system.json'), 'utf8')
    const key = new URL(result.url!).hash.slice('#k='.length)
    expect(await openSpec(received[0]!, key)).toBe(written)
  })

  it('prints only json and never opens with --json', async () => {
    dir = createFixture(CONFIG_WITH_TOKENS)
    await fakeStudio()
    const open = vi.fn()
    const logs: string[] = []

    await runStudio({ cwd: dir, json: true }, { log: (message) => logs.push(message) }, open)

    expect(open).not.toHaveBeenCalled()
    expect(logs).toHaveLength(1)
    expect(JSON.parse(logs[0]!).url).toContain('/view?h=')
  })

  it('does not open with --no-open', async () => {
    dir = createFixture(CONFIG_WITH_TOKENS)
    await fakeStudio()
    const open = vi.fn()

    const result = await runStudio({ cwd: dir, open: false, logLevel: 'silent' }, undefined, open)

    expect(result.ok).toBe(true)
    expect(open).not.toHaveBeenCalled()
  })

  it('writes the spec file when the studio rejects the upload', async () => {
    dir = createFixture(CONFIG_WITH_TOKENS)
    await fakeStudio(500)
    const open = vi.fn()
    const logs: string[] = []

    const result = await runStudio({ cwd: dir }, { log: (message) => logs.push(message) }, open)

    expect(result.ok).toBe(false)
    expect(open).not.toHaveBeenCalled()
    expect(result.files.some((file) => file.endsWith('design-system.json'))).toBe(true)
    expect(logs.join('\n')).toContain('drop')
  })

  it('writes the spec file when the studio is unreachable', async () => {
    dir = createFixture(CONFIG_WITH_TOKENS)
    vi.stubEnv('PANDA_STUDIO_URL', 'http://127.0.0.1:1')

    const result = await runStudio({ cwd: dir, logLevel: 'silent' }, undefined, vi.fn())

    expect(result.ok).toBe(false)
    expect(result.files.some((file) => file.endsWith('design-system.json'))).toBe(true)
  })
})
