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
    // stdin keeps the process alive; exitOnDisconnect (in startMcpServer) ends it.
    await startMcpServer({ cwd: args.cwd, config: args.config, silent: args.silent })
  },
})

runMain(mainCommand).catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
