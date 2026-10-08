// @vitest-environment node
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { decodeSpec } from '@pandacss/compiler-shared'
import { runCodegen, runStudio } from '../src'
import { CONFIG, CONFIG_WITH_TOKENS, cleanupFixture, createFixture, pandaConfig } from './helpers'

let dir: string | undefined

afterEach(() => {
  cleanupFixture(dir)
  dir = undefined
  vi.unstubAllEnvs()
})

describe('studio command', () => {
  it('opens the studio with the spec in the link fragment', async () => {
    dir = createFixture(CONFIG_WITH_TOKENS)
    vi.stubEnv('PANDA_STUDIO_URL', 'http://127.0.0.1:3000')
    const open = vi.fn()
    const logs: string[] = []

    const result = await runStudio({ cwd: dir }, { log: (message) => logs.push(message) }, open)

    expect(result.ok).toBe(true)
    expect(result.url).toMatch(/^http:\/\/127\.0\.0\.1:3000\/view#spec=[\w-]+$/)
    expect(open).toHaveBeenCalledWith(result.url)
    expect(logs.join('\n')).toBe('studio: opened http://127.0.0.1:3000 in your browser')

    await runCodegen({ cwd: dir, spec: true, logLevel: 'silent' })
    const written = readFileSync(join(dir, 'styled-system', 'specs', 'design-system.json'), 'utf8')
    expect(await decodeSpec(new URL(result.url!).hash.slice('#spec='.length))).toBe(written)
  })

  it('prints only json and never opens with --json', async () => {
    dir = createFixture(CONFIG_WITH_TOKENS)
    const open = vi.fn()
    const logs: string[] = []

    await runStudio({ cwd: dir, json: true }, { log: (message) => logs.push(message) }, open)

    expect(open).not.toHaveBeenCalled()
    expect(logs).toHaveLength(1)
    expect(JSON.parse(logs[0]!).url).toMatch(/^https:\/\/studio\.panda-css\.com\/view#spec=/)
  })

  it('prints the link without opening with --no-open', async () => {
    dir = createFixture(CONFIG_WITH_TOKENS)
    const open = vi.fn()
    const logs: string[] = []

    const result = await runStudio({ cwd: dir, open: false }, { log: (message) => logs.push(message) }, open)

    expect(result.ok).toBe(true)
    expect(open).not.toHaveBeenCalled()
    expect(logs.join('\n')).toBe(`studio: ${result.url}`)
  })

  it('writes the spec file when the link would be too long', async () => {
    const colors = Array.from({ length: 4000 }, (_, i) => `c${i}: { value: '#${i.toString(16).padStart(6, '0')}' }`)
    dir = createFixture(pandaConfig(`theme: { tokens: { colors: { ${colors.join(', ')} } } },`))
    const open = vi.fn()
    const logs: string[] = []

    const result = await runStudio({ cwd: dir }, { log: (message) => logs.push(message) }, open)

    expect(result.ok).toBe(false)
    expect(open).not.toHaveBeenCalled()
    expect(result.files.some((file) => file.endsWith('design-system.json'))).toBe(true)
    expect(logs.join('\n')).toContain('too large for a link')
    expect(logs.join('\n')).toContain('drop')
  })

  it('serves a live studio page with --watch and pushes config changes', async () => {
    dir = createFixture(CONFIG_WITH_TOKENS)
    vi.stubEnv('PANDA_STUDIO_URL', 'http://127.0.0.1:3000')
    const open = vi.fn()
    const logs: string[] = []

    const result = await runStudio({ cwd: dir, watch: true }, { log: (message) => logs.push(message) }, open)

    try {
      expect(result.ok).toBe(true)
      expect(result.url).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/)
      expect(open).toHaveBeenCalledWith(result.url)
      expect(logs).toContain(`studio: ${result.url}`)

      const page = await (await fetch(result.url!)).text()
      expect(page).toContain('<iframe src="http://127.0.0.1:3000/view">')

      const events = (await fetch(`${result.url}/events`)).body!.getReader()
      const nextSpec = async () =>
        JSON.parse(JSON.parse(new TextDecoder().decode((await events.read()).value).slice(6)))
      expect((await nextSpec()).paths).toContain('colors.brand')

      writeFileSync(
        join(dir, 'panda.config.ts'),
        pandaConfig("theme: { tokens: { colors: { accent: { value: '#0EA5E9' } } } },"),
      )
      const updated = await nextSpec()
      expect(updated.paths).toContain('colors.accent')
      expect(updated.paths).not.toContain('colors.brand')
      expect(logs).toContain('studio: updated')
      await events.cancel()
    } finally {
      await result.stop?.()
    }
  })

  it('explains an empty design system', async () => {
    dir = createFixture(CONFIG)
    const open = vi.fn()
    const logs: string[] = []

    const result = await runStudio({ cwd: dir }, { log: (message) => logs.push(message) }, open)

    expect(result.ok).toBe(false)
    expect(result.error).toContain('no tokens')
    expect(logs.join('\n')).toContain('studio: nothing to show')
    expect(open).not.toHaveBeenCalled()
  })
})
