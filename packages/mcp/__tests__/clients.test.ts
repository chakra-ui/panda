import { describe, expect, test } from 'vitest'
import { MCP_CLIENTS, generateMcpConfig } from '../src/clients'

describe('generateMcpConfig', () => {
  test('points every client at npx -y @pandacss/mcp', () => {
    for (const client of Object.values(MCP_CLIENTS)) {
      const config = generateMcpConfig(client)
      expect(config[client.configKey]).toEqual({
        panda: {
          command: 'npx',
          args: ['-y', '@pandacss/mcp'],
        },
      })
    }
  })

  test('uses servers key for vscode', () => {
    const config = generateMcpConfig(MCP_CLIENTS.vscode)
    expect(config).toHaveProperty('servers.panda')
    expect(config).not.toHaveProperty('mcpServers')
  })
})
