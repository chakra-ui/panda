import { defineCommand, runMain } from 'citty'
import { buildArgs, buildCommand } from './commands/build'
import { buildinfoCommand } from './commands/buildinfo'
import { codegenCommand } from './commands/codegen'
import { cssgenCommand } from './commands/cssgen'
import { debugCommand } from './commands/debug'
import { initCommand } from './commands/init'
import { inspectCommand } from './commands/inspect'
import { validateCommand } from './commands/validate'
import { ExitCode } from './result'
import { useDispatcher } from './routing'

export async function main(argv = process.argv): Promise<void> {
  const ctx = { cwd: process.cwd() }
  const rawArgs = argv.slice(2)

  // The default `panda` (no subcommand) runs the full build.
  const build = buildCommand(ctx)

  // Runless on purpose: citty runs a root's `run` even after a subcommand matches, which would re-run
  // the build on top of every subcommand. `args` is here only so `panda --help` documents the default
  // build's flags — the build command object itself lives outside this subcommand tree.
  const dispatcher = defineCommand({
    meta: {
      name: 'panda',
      description: 'Generate the panda system and CSS. Run with no subcommand for the full build.',
    },
    args: buildArgs(ctx),
    subCommands: {
      buildinfo: buildinfoCommand(ctx),
      codegen: codegenCommand(ctx),
      cssgen: cssgenCommand(ctx),
      debug: debugCommand(ctx),
      init: initCommand(ctx),
      inspect: inspectCommand(ctx),
      validate: validateCommand(ctx),
    },
  })

  if (useDispatcher(rawArgs)) {
    await runMain(dispatcher, { rawArgs })
  } else {
    await runMain(build, { rawArgs })
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = ExitCode.UsageError
})
