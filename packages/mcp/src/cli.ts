import { defineCommand, runMain } from 'citty'
import { startMcpServer } from './server'

const mainCommand = defineCommand({
  meta: {
    name: 'panda-mcp',
    description: 'Panda CSS MCP server',
  },
  args: {
    cwd: { type: 'string', description: 'Current working directory' },
    config: { type: 'string', description: 'Path to panda config file', alias: 'c' },
    silent: { type: 'boolean', description: 'Suppress startup logs' },
  },
  run: async ({ args }) => {
    await startMcpServer({ cwd: args.cwd, config: args.config, silent: args.silent })
    await new Promise<never>(() => {
      // Keep stdio transport alive until the parent process exits.
    })
  },
})

runMain(mainCommand).catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
