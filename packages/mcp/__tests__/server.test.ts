// @vitest-environment node

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from 'vitest'
import pkg from '../package.json'
import { withClient } from './helpers'

test('initialize reports the published package version', async () => {
  await withClient(async (client) => {
    expect(client.getServerVersion()).toEqual({ name: pkg.name, version: pkg.version })
  })
})

test('the documented tool list matches the tools exposed over MCP', async () => {
  await withClient(async (client) => {
    const { tools } = await client.listTools()
    const names = tools.map((tool) => tool.name).sort()

    expect(names).toMatchInlineSnapshot(`
      [
        "get_animation_styles",
        "get_color_palette",
        "get_conditions",
        "get_config",
        "get_keyframes",
        "get_layer_styles",
        "get_patterns",
        "get_recipes",
        "get_semantic_tokens",
        "get_text_styles",
        "get_tokens",
        "get_usage_report",
      ]
    `)

    const docs = readFileSync(resolve('website/content/docs/get-started/mcp-server.mdx'), 'utf8')
    const documentedNames = [...docs.matchAll(/^\| `(get_[^`]+)`\s+\|/gm)].map((match) => match[1]).sort()

    expect(documentedNames).toEqual(names)
  })
})
