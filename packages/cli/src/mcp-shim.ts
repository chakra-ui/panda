import { spawn, type SpawnOptions } from 'node:child_process'

export const MCP_PACKAGE = '@pandacss/mcp'

export interface McpShimFlags {
  cwd?: string
  config?: string
  client?: string | string[]
  silent?: boolean
}

export interface McpRunner {
  command: string
  prefixArgs: string[]
}

/**
 * Resolve how to invoke `@pandacss/mcp`.
 *
 * - `PANDACSS_MCP_BIN` points at a local binary (monorepo/tests)
 * - otherwise shell out through `npx -y @pandacss/mcp`
 */
export function getMcpRunner(env: NodeJS.ProcessEnv = process.env): McpRunner {
  const localBin = env.PANDACSS_MCP_BIN
  if (localBin) {
    return { command: localBin, prefixArgs: [] }
  }
  return { command: 'npx', prefixArgs: ['-y', MCP_PACKAGE] }
}

export function buildMcpArgs(command: 'start' | 'init', flags: McpShimFlags = {}): string[] {
  const args: string[] = []

  if (command === 'init') {
    args.push('init')
  }

  if (flags.cwd) {
    args.push('--cwd', flags.cwd)
  }

  if (flags.config) {
    args.push('--config', flags.config)
  }

  if (flags.silent) {
    args.push('--silent')
  }

  if (command === 'init' && flags.client) {
    const clients = Array.isArray(flags.client) ? flags.client : [flags.client]
    const value = clients
      .flatMap((client) => client.split(','))
      .map((client) => client.trim())
      .filter(Boolean)
      .join(',')
    if (value) {
      args.push('--client', value)
    }
  }

  return args
}

export interface RunMcpOptions {
  env?: NodeJS.ProcessEnv
  spawnImpl?: typeof spawn
  spawnOptions?: SpawnOptions
}

/**
 * Run the Panda MCP CLI via npx (or `PANDACSS_MCP_BIN` when set).
 * Uses inherited stdio so MCP hosts can speak JSON-RPC over stdin/stdout.
 */
export function runMcpViaNpx(command: 'start' | 'init', flags: McpShimFlags = {}, options: RunMcpOptions = {}) {
  const env = options.env ?? process.env
  const runner = getMcpRunner(env)
  const args = [...runner.prefixArgs, ...buildMcpArgs(command, flags)]
  const spawnImpl = options.spawnImpl ?? spawn

  return new Promise<number>((resolve, reject) => {
    const child = spawnImpl(runner.command, args, {
      stdio: 'inherit',
      // npx is a shell script/cmd shim on many platforms
      shell: true,
      env,
      ...options.spawnOptions,
    })

    child.on('error', reject)
    child.on('exit', (code, signal) => {
      if (signal) {
        resolve(1)
        return
      }
      resolve(code ?? 1)
    })
  })
}
