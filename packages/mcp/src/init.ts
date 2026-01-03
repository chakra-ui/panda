import * as p from '@clack/prompts'
import { logger } from '@pandacss/logger'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { CLIENT_NAMES, generateMcpConfig, getClientConfig, isValidClient, MCP_CLIENTS, type McpClient } from './clients'

export interface InitMcpConfigOptions {
  cwd?: string
  clients?: McpClient[]
}

export async function initMcpConfig(options: InitMcpConfigOptions = {}) {
  const { cwd = process.cwd() } = options
  let { clients } = options

  p.intro('Panda MCP Setup')

  // If no clients specified, prompt user to select
  if (!clients || clients.length === 0) {
    const selected = await p.multiselect({
      message: 'Select AI clients to configure:',
      options: CLIENT_NAMES.map((client) => ({
        value: client,
        label: MCP_CLIENTS[client].label,
      })),
      required: true,
    })

    if (p.isCancel(selected)) {
      p.cancel('Setup cancelled.')
      process.exit(0)
    }

    clients = selected as McpClient[]
  }

  // Validate clients
  const validClients = clients.filter((client) => {
    if (!isValidClient(client)) {
      logger.warn('mcp:init', `Unknown client: ${client}`)
      return false
    }
    return true
  })

  if (validClients.length === 0) {
    p.cancel('No valid clients selected.')
    process.exit(1)
  }

  const results: { client: McpClient; path: string; created: boolean }[] = []

  for (const client of validClients) {
    const clientConfig = getClientConfig(client)
    const configPath = resolve(cwd, clientConfig.configPath)
    const configDir = dirname(configPath)

    // Ensure directory exists
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true })
    }

    // Generate new config
    const newConfig = generateMcpConfig(clientConfig)

    // Check if config file already exists
    let finalConfig = newConfig
    if (existsSync(configPath)) {
      try {
        const existingContent = readFileSync(configPath, 'utf-8')
        const existingConfig = JSON.parse(existingContent)

        // Merge with existing config
        finalConfig = {
          ...existingConfig,
          [clientConfig.configKey]: {
            ...existingConfig[clientConfig.configKey],
            ...newConfig[clientConfig.configKey],
          },
        }
      } catch {
        // If parsing fails, use new config
      }
    }

    // Write config file
    writeFileSync(configPath, JSON.stringify(finalConfig, null, 2))

    results.push({
      client,
      path: clientConfig.configPath,
      created: true,
    })
  }

  // Show results
  p.note(results.map((r) => `${r.client}: ${r.path}`).join('\n'), 'Created MCP configurations')

  p.outro('MCP setup complete! Your AI assistants can now use Panda CSS tools.')

  return results
}
