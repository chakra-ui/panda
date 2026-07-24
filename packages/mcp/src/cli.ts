import { cac } from 'cac'
import { resolve } from 'path'
import { version } from '../package.json'
import type { McpClient } from './clients'
import { initMcpConfig } from './init'
import { startMcpServer } from './server'

function parseClients(value?: string | string[]) {
  if (!value) return undefined

  const values = Array.isArray(value) ? value : [value]
  return values
    .flatMap((client) => client.split(','))
    .map((client) => client.trim())
    .filter(Boolean) as McpClient[]
}

export async function main(argv = process.argv.slice(2)) {
  const cli = cac('panda-mcp')
  const cwd = process.cwd()

  // Default command: `npx @pandacss/mcp` (no subcommand) must keep starting the server.
  cli
    .command('[command]', 'Start MCP server for AI assistants')
    .option('-c, --config <path>', 'Path to panda config file')
    .option('--cwd <cwd>', 'Current working directory', { default: cwd })
    .option('--silent', 'Suppress startup logs')
    .action(async (command: string | undefined, flags: { cwd?: string; config?: string; silent?: boolean }) => {
      if (command) {
        throw new Error(`Unknown command: ${command}`)
      }

      await startMcpServer({
        cwd: resolve(flags.cwd ?? cwd),
        config: flags.config,
        silent: flags.silent,
      })
    })

  cli
    .command('init', 'Initialize MCP configuration for AI clients')
    .option('--cwd <cwd>', 'Current working directory', { default: cwd })
    .option('--client <clients>', 'AI clients to configure (claude, cursor, vscode, windsurf, codex)')
    .action(async (flags: { cwd?: string; client?: string | string[] }) => {
      await initMcpConfig({
        cwd: resolve(flags.cwd ?? cwd),
        clients: parseClients(flags.client),
      })
    })

  cli.help()
  cli.version(version)

  cli.parse(['node', 'panda-mcp', ...argv], { run: false })
  await cli.runMatchedCommand()
}
