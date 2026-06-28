import { describe, expect, test } from 'vitest'
import { generateMcpConfig, MCP_CLIENTS } from '../src/clients'

describe('generateMcpConfig', () => {
  test('resolves the @pandacss/dev binary and pins the project cwd', () => {
    expect(generateMcpConfig(MCP_CLIENTS.claude, '/project')).toMatchInlineSnapshot(`
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
            "cwd": "/project",
          },
        },
      }
    `)
  })

  test('honors the client config key (vscode uses `servers`)', () => {
    const config = generateMcpConfig(MCP_CLIENTS.vscode, '/project')
    expect(config).toHaveProperty('servers.panda')
    expect((config as any).servers.panda.cwd).toBe('/project')
  })
})
