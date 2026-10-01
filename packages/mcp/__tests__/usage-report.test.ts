// @vitest-environment node

import type { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { createNodeDriver, type Driver, type Diagnostic, type UsageReport } from '@pandacss/compiler'
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { withClient } from './helpers'

const config = `export default {
  presets: [],
  include: ['*.tsx'],
  exclude: ['ignored.tsx'],
  importMap: {
    css: ['@panda/css'],
    recipe: ['@panda/recipes'],
    pattern: ['@panda/patterns'],
  },
  utilities: {
    color: { values: 'colors' },
    animationName: { values: 'keyframes' },
  },
  patterns: {
    stack: { transform: () => ({ display: 'flex' }) },
  },
  theme: {
    tokens: { colors: { brand: { value: 'red' }, unused: { value: 'blue' } } },
    recipes: {
      button: {
        className: 'button',
        variants: { size: { sm: { color: 'brand' }, lg: { color: 'unused' } } },
      },
    },
    keyframes: { spin: { to: { transform: 'rotate(360deg)' } } },
  },
}`

const source = `import { css } from '@panda/css'
import { button } from '@panda/recipes'
import { stack } from '@panda/patterns'

css({ color: 'brand', animationName: 'spin' })
button({ size: 'sm' })
stack({})
`

let dir: string
let driver: Driver

beforeEach(async () => {
  dir = realpathSync(mkdtempSync(join(tmpdir(), 'panda-mcp-')))
  writeFileSync(join(dir, 'panda.config.ts'), config)
  writeFileSync(join(dir, 'App.tsx'), source)
  writeFileSync(join(dir, 'ignored.tsx'), "import { css } from '@panda/css'; css({ color: 'unused' })")
  driver = await createNodeDriver({ cwd: dir })
})

afterEach(() => {
  vi.restoreAllMocks()
  rmSync(dir, { recursive: true, force: true })
})

async function report(client: Client, scope?: string) {
  const result = await client.callTool({ name: 'get_usage_report', arguments: scope ? { scope } : {} })
  const content = result.content as Array<{ type: string; text: string }>

  return {
    isError: result.isError,
    data: JSON.parse(content[0].text) as UsageReport & { diagnostics: Diagnostic[] },
  }
}

test('reports all usage categories and ignores excluded sources', async () => {
  await withClient(async (client) => {
    const { isError, data } = await report(client)

    expect({
      isError,
      scope: data.scope,
      sourceCount: data.sourceCount,
      usages: data.usages.map(({ kind, name, line }) => ({ kind, name, line })),
      unusedTokens: data.views?.tokens.unused,
      diagnostics: data.diagnostics,
    }).toMatchInlineSnapshot(`
      {
        "diagnostics": [],
        "isError": false,
        "scope": "all",
        "sourceCount": 1,
        "unusedTokens": [
          "colors.unused",
        ],
        "usages": [
          {
            "kind": "keyframe",
            "line": 5,
            "name": "spin",
          },
          {
            "kind": "token",
            "line": 5,
            "name": "colors.brand",
          },
          {
            "kind": "utility",
            "line": 5,
            "name": "color",
          },
          {
            "kind": "utility",
            "line": 5,
            "name": "animationName",
          },
          {
            "kind": "recipe",
            "line": 6,
            "name": "button",
          },
          {
            "kind": "pattern",
            "line": 7,
            "name": "stack",
          },
        ],
      }
    `)
  }, driver)
})

test('supports all six scopes', async () => {
  await withClient(async (client) => {
    const scopes = ['all', 'tokens', 'recipes', 'utilities', 'patterns', 'keyframes']
    const results = []

    for (const scope of scopes) {
      const { isError, data } = await report(client, scope)
      results.push({ scope: data.scope, isError, usages: data.usages.map(({ kind, name }) => `${kind}: ${name}`) })
    }

    expect(results).toMatchInlineSnapshot(`
      [
        {
          "isError": false,
          "scope": "all",
          "usages": [
            "keyframe: spin",
            "token: colors.brand",
            "utility: color",
            "utility: animationName",
            "recipe: button",
            "pattern: stack",
          ],
        },
        {
          "isError": false,
          "scope": "tokens",
          "usages": [
            "token: colors.brand",
          ],
        },
        {
          "isError": false,
          "scope": "recipes",
          "usages": [
            "recipe: button",
          ],
        },
        {
          "isError": false,
          "scope": "utilities",
          "usages": [
            "utility: color",
            "utility: animationName",
          ],
        },
        {
          "isError": false,
          "scope": "patterns",
          "usages": [
            "pattern: stack",
          ],
        },
        {
          "isError": false,
          "scope": "keyframes",
          "usages": [
            "keyframe: spin",
          ],
        },
      ]
    `)
  }, driver)
})

test('reads changed sources and rescans added and removed files on each call', async () => {
  await withClient(async (client) => {
    const first = await report(client, 'tokens')

    writeFileSync(join(dir, 'App.tsx'), "import { css } from '@panda/css'; css({ color: 'unused' })")
    writeFileSync(join(dir, 'Added.tsx'), "import { css } from '@panda/css'; css({ color: 'brand' })")
    const second = await report(client, 'tokens')

    rmSync(join(dir, 'App.tsx'))
    const third = await report(client, 'tokens')

    expect(
      [first, second, third].map(({ data }) => ({
        sourceCount: data.sourceCount,
        usages: data.usages.map(({ name, file }) => ({ name, file: file.replace(dir, '<project>') })),
      })),
    ).toMatchInlineSnapshot(`
      [
        {
          "sourceCount": 1,
          "usages": [
            {
              "file": "<project>/App.tsx",
              "name": "colors.brand",
            },
          ],
        },
        {
          "sourceCount": 2,
          "usages": [
            {
              "file": "<project>/Added.tsx",
              "name": "colors.brand",
            },
            {
              "file": "<project>/App.tsx",
              "name": "colors.unused",
            },
          ],
        },
        {
          "sourceCount": 1,
          "usages": [
            {
              "file": "<project>/Added.tsx",
              "name": "colors.brand",
            },
          ],
        },
      ]
    `)
  }, driver)
})

test('returns parse diagnostics as an MCP tool error', async () => {
  writeFileSync(join(dir, 'App.tsx'), "import { css } from '@panda/css'; css({ color:")

  await withClient(async (client) => {
    const { isError, data } = await report(client)

    expect({
      isError,
      diagnostics: data.diagnostics.map(({ code, severity, file }) => ({
        code,
        severity,
        file: file?.replace(dir, '<project>'),
      })),
    }).toMatchInlineSnapshot(`
      {
        "diagnostics": [
          {
            "code": "js_parse_error",
            "file": "<project>/App.tsx",
            "severity": "warning",
          },
        ],
        "isError": true,
      }
    `)
  }, driver)
})

test('reports unreadable sources instead of claiming a complete scan', async () => {
  vi.spyOn(driver, 'scan').mockReturnValue([join(dir, 'missing.tsx')])

  await withClient(async (client) => {
    const { isError, data } = await report(client)

    expect({
      isError,
      sourceCount: data.sourceCount,
      diagnostics: data.diagnostics.map((diagnostic) => ({
        ...diagnostic,
        file: diagnostic.file?.replace(dir, '<project>'),
      })),
    }).toMatchInlineSnapshot(`
      {
        "diagnostics": [
          {
            "category": "analyze",
            "code": "analyze_file_read_error",
            "file": "<project>/missing.tsx",
            "message": "Could not read source file",
            "severity": "error",
          },
        ],
        "isError": true,
        "sourceCount": 0,
      }
    `)
  }, driver)
})

test('returns scan failures as MCP tool errors', async () => {
  vi.spyOn(driver, 'scan').mockImplementation(() => {
    throw new Error('Scan failed')
  })

  await withClient(async (client) => {
    expect(await client.callTool({ name: 'get_usage_report', arguments: {} })).toMatchInlineSnapshot(`
      {
        "content": [
          {
            "text": "Scan failed",
            "type": "text",
          },
        ],
        "isError": true,
      }
    `)
  }, driver)
})

test('returns an empty report when no files match', async () => {
  rmSync(join(dir, 'App.tsx'))

  await withClient(async (client) => {
    const { isError, data } = await report(client)

    expect({ isError, sourceCount: data.sourceCount, usages: data.usages, diagnostics: data.diagnostics })
      .toMatchInlineSnapshot(`
        {
          "diagnostics": [],
          "isError": false,
          "sourceCount": 0,
          "usages": [],
        }
      `)
  }, driver)
})

test('keeps usage warnings in successful reports', async () => {
  writeFileSync(join(dir, 'App.tsx'), "import { css } from '@panda/css'; css({ _missing: { color: 'brand' } })")

  await withClient(async (client) => {
    const { isError, data } = await report(client)

    expect({
      isError,
      diagnostics: data.diagnostics.map(({ code, severity, file }) => ({
        code,
        severity,
        file: file?.replace(dir, '<project>'),
      })),
    }).toMatchInlineSnapshot(`
      {
        "diagnostics": [
          {
            "code": "unknown_condition",
            "file": "<project>/App.tsx",
            "severity": "warning",
          },
        ],
        "isError": false,
      }
    `)
  }, driver)
})

test.each(['token', 'recipe', 'unknown'])('rejects unsupported scope %s', async (scope) => {
  await withClient(async (client) => {
    const result = await client.callTool({ name: 'get_usage_report', arguments: { scope } })

    expect(result.isError).toBe(true)
  }, driver)
})
