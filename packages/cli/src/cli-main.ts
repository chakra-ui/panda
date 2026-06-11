import { defineCommand, runMain } from 'citty'
import { buildinfoCommand } from './commands/buildinfo'
import { codegenCommand } from './commands/codegen'
import { cssgenCommand } from './commands/cssgen'
import { inspectCommand } from './commands/inspect'
import { initMcpCommand, mcpCommand } from './commands/mcp'
import { validateCommand } from './commands/validate'
import { ExitCode } from './result'

export async function main(argv = process.argv): Promise<void> {
  const ctx = { cwd: process.cwd() }

  const mainCommand = defineCommand({
    meta: {
      name: 'panda',
      description: 'CLI for the Panda CSS Rust compiler',
    },
    subCommands: {
      buildinfo: buildinfoCommand(ctx),
      codegen: codegenCommand(ctx),
      cssgen: cssgenCommand(ctx),
      inspect: inspectCommand(ctx),
      mcp: mcpCommand(ctx),
      'init-mcp': initMcpCommand(ctx),
      validate: validateCommand(ctx),
    },
  })

  await runMain(mainCommand, { rawArgs: argv.slice(2) })
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = ExitCode.UsageError
})
