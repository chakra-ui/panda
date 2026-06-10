import { defineCommand } from 'citty'
import type { CommandContext } from '../types'

export function mcpCommand(ctx: CommandContext) {
  return defineCommand({
    meta: {
      name: 'mcp',
      description: 'Start the Panda CSS MCP server (stdio transport)',
    },
    args: {
      cwd: { type: 'string', description: 'Current working directory', default: ctx.cwd },
      config: { type: 'string', description: 'Path to panda config file', alias: 'c' },
      silent: { type: 'boolean', description: 'Suppress startup logs' },
    },
    run: async ({ args }) => {
      const { startMcpServer } = await import('@pandacss/mcp')
      await startMcpServer({ cwd: args.cwd, config: args.config, silent: args.silent })
      // Keep the process alive while the server is connected over stdio
      await new Promise(() => {})
    },
  })
}

export function initMcpCommand(ctx: CommandContext) {
  return defineCommand({
    meta: {
      name: 'init-mcp',
      description: 'Configure AI clients (Claude, Cursor, VS Code, ...) to use the Panda CSS MCP server',
    },
    args: {
      cwd: { type: 'string', description: 'Current working directory', default: ctx.cwd },
      clients: { type: 'string', description: 'Comma-separated client list (claude, cursor, vscode, windsurf, codex)' },
    },
    run: async ({ args }) => {
      const { initMcpConfig } = await import('@pandacss/mcp')
      const clients = args.clients?.split(',').map((client: string) => client.trim())
      await initMcpConfig({ cwd: args.cwd, clients: clients as never })
    },
  })
}
