// @vitest-environment node

import type { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { createNodeDriver, type Driver } from '@pandacss/compiler'
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { withClient } from './helpers'

const config = [
  "import { preset } from './preset'",
  'export default {',
  '  presets: [preset],',
  "  theme: { tokens: { colors: { brand: { value: 'red' } } } },",
  '}',
].join('\n')

const preset = (zIndex: string) =>
  ['export const preset = {', `  theme: { tokens: { zIndex: { devtools: { value: '${zIndex}' } } } },`, '}'].join('\n')

let dir: string
let driver: Driver

beforeEach(async () => {
  dir = realpathSync(mkdtempSync(join(tmpdir(), 'panda-mcp-reload-')))
  writeFileSync(join(dir, 'panda.config.ts'), config)
  writeFileSync(join(dir, 'preset.ts'), preset('400'))
  driver = await createNodeDriver({ cwd: dir })
})

afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

async function call(client: Client, name: string, args: Record<string, unknown>) {
  const result = await client.callTool({ name, arguments: args })
  const content = result.content as Array<{ type: string; text: string }>
  return { isError: result.isError, text: content[0].text }
}

test('answers with the new value after editing a token in an imported preset', async () => {
  await withClient(async (client) => {
    const before = await call(client, 'get_tokens', { category: 'zIndex' })
    expect(JSON.parse(before.text).values['zIndex.devtools']).toBe('400')

    writeFileSync(join(dir, 'preset.ts'), preset('1000'))

    const after = await call(client, 'get_tokens', { category: 'zIndex' })
    expect(JSON.parse(after.text).values['zIndex.devtools']).toBe('1000')
  }, driver)
})

test('picks up edits to a preset swapped in with the same values', async () => {
  await withClient(async (client) => {
    writeFileSync(join(dir, 'other-preset.ts'), preset('400'))
    writeFileSync(join(dir, 'panda.config.ts'), config.replace("'./preset'", "'./other-preset'"))
    await call(client, 'get_tokens', { category: 'zIndex' })

    writeFileSync(join(dir, 'other-preset.ts'), preset('1000'))

    const after = await call(client, 'get_tokens', { category: 'zIndex' })
    expect(JSON.parse(after.text).values['zIndex.devtools']).toBe('1000')
  }, driver)
})

test('picks up an edit saved while a reload is running', async () => {
  const reload = driver.reload.bind(driver)
  driver.reload = async () => {
    const diff = await reload()
    driver.reload = reload
    writeFileSync(join(dir, 'preset.ts'), preset('50'))
    return diff
  }

  await withClient(async (client) => {
    writeFileSync(join(dir, 'preset.ts'), preset('1000'))
    await call(client, 'get_tokens', { category: 'zIndex' })

    const after = await call(client, 'get_tokens', { category: 'zIndex' })
    expect(JSON.parse(after.text).values['zIndex.devtools']).toBe('50')
  }, driver)
})

test('accepts a token category added after the server started', async () => {
  await withClient(async (client) => {
    writeFileSync(
      join(dir, 'panda.config.ts'),
      config.replace(
        "colors: { brand: { value: 'red' } }",
        "colors: { brand: { value: 'red' } }, sizes: { lg: { value: '4rem' } }",
      ),
    )

    const result = await call(client, 'get_tokens', { category: 'sizes' })
    expect(result.isError).toBeFalsy()
    expect(Object.keys(JSON.parse(result.text).values)).toEqual(['sizes.lg'])
  }, driver)
})

test('lists the available names when asked for an unknown category', async () => {
  await withClient(async (client) => {
    expect(await call(client, 'get_tokens', { category: 'nope' })).toMatchInlineSnapshot(`
      {
        "isError": true,
        "text": "Unknown token category "nope". Available: colors, zIndex",
      }
    `)
  }, driver)
})
