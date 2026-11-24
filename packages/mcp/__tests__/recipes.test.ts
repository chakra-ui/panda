// @vitest-environment node

import type { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { createNodeDriver, type Driver } from '@pandacss/compiler'
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { withClient } from './helpers'

const config = `export default {
  theme: {
    recipes: {
      button: {
        className: 'button',
        description: 'The primary action',
        variants: { size: { sm: {}, md: {} } },
        defaultVariants: { size: 'md' },
      },
      badge: { className: 'badge', variants: { size: { sm: {} } } },
    },
    slotRecipes: {
      card: {
        className: 'card',
        description: 'A content container',
        slots: ['root'],
        variants: { size: { sm: { root: {} }, lg: { root: {} } } },
        defaultVariants: { size: 'lg' },
      },
    },
  },
}`

let dir: string
let driver: Driver

beforeAll(async () => {
  dir = realpathSync(mkdtempSync(join(tmpdir(), 'panda-mcp-recipes-')))
  writeFileSync(join(dir, 'panda.config.ts'), config)
  driver = await createNodeDriver({ cwd: dir })
})

afterAll(() => {
  rmSync(dir, { recursive: true, force: true })
})

async function getRecipes(client: Client, args: Record<string, unknown>) {
  const result = await client.callTool({ name: 'get_recipes', arguments: args })
  return JSON.parse((result.content as Array<{ text: string }>)[0].text)
}

test('returns the recipe description and default variants', async () => {
  await withClient(async (client) => {
    expect(await getRecipes(client, { name: 'button' })).toMatchInlineSnapshot(`
      {
        "recipes": {
          "button": {
            "defaultVariants": {
              "size": "md",
            },
            "description": "The primary action",
            "name": "button",
            "typeName": "Button",
            "variants": {
              "size": {
                "allowsBoolean": false,
                "values": [
                  "sm",
                  "md",
                ],
              },
            },
          },
        },
        "slotRecipes": {},
      }
    `)
  }, driver)
})

test('returns the slot recipe description and default variants', async () => {
  await withClient(async (client) => {
    expect(await getRecipes(client, { name: 'card' })).toMatchInlineSnapshot(`
      {
        "recipes": {},
        "slotRecipes": {
          "card": {
            "defaultVariants": {
              "size": "lg",
            },
            "description": "A content container",
            "name": "card",
            "slots": [
              "root",
            ],
            "typeName": "Card",
            "variants": {
              "size": {
                "allowsBoolean": false,
                "values": [
                  "sm",
                  "lg",
                ],
              },
            },
          },
        },
      }
    `)
  }, driver)
})

test.each([
  ['get_recipes', 'name', 'Unknown recipe "constructor". Available: badge, button, card'],
  ['get_patterns', 'name', 'Unknown pattern "constructor"'],
  ['get_tokens', 'category', 'Unknown token category "constructor"'],
])('%s rejects a name inherited from Object.prototype', async (tool, arg, message) => {
  await withClient(async (client) => {
    const result = await client.callTool({ name: tool, arguments: { [arg]: 'constructor' } })
    expect((result.content as Array<{ text: string }>)[0].text).toContain(message)
  }, driver)
})
