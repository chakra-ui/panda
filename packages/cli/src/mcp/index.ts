import { logger } from '@pandacss/logger'
import { resolve } from 'path'
import { PandaMcpServer, type McpServerOptions } from './server'

export interface StartMcpServerOptions {
  cwd?: string
  config?: string
  silent?: boolean
  logfile?: string
}

export async function startMcpServer(options: StartMcpServerOptions = {}) {
  const { cwd = process.cwd(), config: configPath, silent = false } = options

  if (silent) {
    logger.level = 'silent'
  }

  // Resolve paths
  const resolvedCwd = resolve(cwd)
  const resolvedConfigPath = configPath ? resolve(configPath) : undefined

  logger.info('mcp', 'Starting Panda CSS MCP server...')

  const serverOptions: McpServerOptions = {
    cwd: resolvedCwd,
    configPath: resolvedConfigPath,
  }

  const server = new PandaMcpServer(serverOptions)

  // Always use stdio transport (MCP standard)
  await server.start()

  // Handle process termination
  process.on('SIGINT', async () => {
    logger.info('mcp', 'Received SIGINT, shutting down MCP server...')
    await server.stop()
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    logger.info('mcp', 'Received SIGTERM, shutting down MCP server...')
    await server.stop()
    process.exit(0)
  })
}

// Export types and server class for external use
export { PandaMcpServer, type McpServerOptions }
