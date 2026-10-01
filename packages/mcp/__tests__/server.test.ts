// @vitest-environment node

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import type { Driver } from '@pandacss/compiler'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from 'vitest'
import pkg from '../package.json'
import { createMcpServer } from '../src/server'

async function withClient(run: (client: Client) => Promise<void>) {
  const driver = {
    config: { theme: {} },
    introspect: {
      spec: { tokens: { categories: {} } },
      recipes: () => [],
      patterns: () => [],
    },
  } as unknown as Driver

  const server = createMcpServer({ driver })
  const client = new Client({ name: 'panda-mcp-test', version: '1.0.0' })
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()

  try {
    await server.connect(serverTransport)
    await client.connect(clientTransport)
    await run(client)
  } finally {
    await client.close()
    await server.close()
  }
}

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
      ]
    `)

    const docs = readFileSync(resolve('website/content/docs/get-started/mcp-server.mdx'), 'utf8')
    const documentedNames = [...docs.matchAll(/^\| `(get_[^`]+)`\s+\|/gm)].map((match) => match[1]).sort()

    expect(documentedNames).toEqual(names)
  })
})
