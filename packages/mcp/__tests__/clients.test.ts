import { describe, expect, test } from 'vitest'
import { generateMcpConfig, MCP_CLIENTS } from '../src/clients'

describe('generateMcpConfig', () => {
  test('uses an npx command that resolves the @pandacss/dev binary', () => {
    // `npx panda` resolves an unrelated `panda` package on npm (no bin), which fails with
    // "npm error could not determine executable to run". Reference @pandacss/dev explicitly
    // and pass the `panda` bin name so npx runs the right executable.
    expect(generateMcpConfig(MCP_CLIENTS.claude)).toMatchInlineSnapshot(`
      {
        "mcpServers": {
          "panda": {
            "args": [
              "-y",
              "--package",
              "@pandacss/dev",
              "panda",
              "mcp",
            ],
            "command": "npx",
          },
        },
      }
    `)
  })

  test('honors the client config key (vscode uses `servers`)', () => {
    const config = generateMcpConfig(MCP_CLIENTS.vscode)
    expect(config).toHaveProperty('servers.panda')
    expect((config as any).servers.panda.args).toEqual(['-y', '--package', '@pandacss/dev', 'panda', 'mcp'])
  })
})
