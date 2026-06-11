import { initMcpConfig } from './init'
import { startMcpServer } from './server'
import type { McpClient } from './clients'

interface ParsedArgs {
  command?: string
  cwd?: string
  config?: string
  clients?: McpClient[]
  silent?: boolean
  help?: boolean
}

function usage() {
  return `Panda CSS MCP server

Usage:
  panda-mcp [--cwd <path>] [--config <path>] [--silent]
  panda-mcp init [--cwd <path>] [--client <names>]

Options:
  --cwd <path>             Current working directory
  --config, -c <path>      Path to panda config file
  --client, --clients      Comma-separated client list for init
  --silent                 Suppress startup logs
  --help, -h               Show help
`
}

function readValue(args: string[], index: number, flag: string) {
  const value = args[index + 1]
  if (!value || value.startsWith('-')) {
    throw new Error(`Missing value for ${flag}`)
  }
  return value
}

function parseClients(value: string) {
  return value
    .split(',')
    .map((client) => client.trim())
    .filter(Boolean) as McpClient[]
}

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = {}
  let index = 0

  while (index < argv.length) {
    const arg = argv[index]

    if (!parsed.command && !arg.startsWith('-')) {
      parsed.command = arg
      index += 1
      continue
    }

    switch (arg) {
      case '--cwd':
        parsed.cwd = readValue(argv, index, arg)
        index += 2
        break
      case '--config':
      case '-c':
        parsed.config = readValue(argv, index, arg)
        index += 2
        break
      case '--client':
      case '--clients':
        parsed.clients = parseClients(readValue(argv, index, arg))
        index += 2
        break
      case '--silent':
        parsed.silent = true
        index += 1
        break
      case '--help':
      case '-h':
        parsed.help = true
        index += 1
        break
      default:
        throw new Error(`Unknown option: ${arg}`)
    }
  }

  return parsed
}

async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv)

  if (args.help) {
    console.log(usage())
    return
  }

  switch (args.command) {
    case undefined:
      await startMcpServer({ cwd: args.cwd, config: args.config, silent: args.silent })
      await new Promise(() => {})
      break
    case 'init':
      await initMcpConfig({ cwd: args.cwd, clients: args.clients })
      break
    default:
      throw new Error(`Unknown command: ${args.command}`)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
