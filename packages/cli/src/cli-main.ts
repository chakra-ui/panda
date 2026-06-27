import { defineCommand, renderUsage, runMain, type ArgsDef, type CommandDef } from 'citty'
import { buildArgs, buildCommand, buildSubcommand, checkCommand, devCommand } from './commands/build'
import { analyzeCommand } from './commands/analyze'
import { buildinfoCommand } from './commands/buildinfo'
import { codegenCommand } from './commands/codegen'
import { cssgenCommand } from './commands/cssgen'
import { debugCommand } from './commands/debug'
import { doctorCommand } from './commands/doctor'
import { infoCommand } from './commands/info'
import { initCommand } from './commands/init'
import { ExitCode } from './result'
import { readCliVersion } from './version'

export async function main(argv = process.argv): Promise<void> {
  const rawArgs = normalizeRawArgs(argv.slice(2))
  const version = readCliVersion()

  // The default `panda` (no subcommand) runs the full build.
  const build = buildCommand

  // Runless on purpose: citty runs a root's `run` even after a subcommand matches, which would re-run
  // the build on top of every subcommand. `args` is here only so `panda --help` documents the default
  // build's flags — the build command object itself lives outside this subcommand tree.
  const dispatcher = defineCommand({
    meta: {
      name: 'panda',
      version,
      description: 'Generate the panda system and CSS. Run with no subcommand for the full build.',
    },
    args: buildArgs,
    subCommands: {
      init: initCommand,
      dev: devCommand,
      build: buildSubcommand,
      check: checkCommand,
      info: infoCommand,
      doctor: doctorCommand,
      debug: debugCommand,
      buildinfo: buildinfoCommand,
      analyze: analyzeCommand,
      codegen: codegenCommand,
      cssgen: cssgenCommand,
    },
  })

  if (isVersionRequest(rawArgs)) {
    console.log(version)
    return
  }

  if (shouldUseDispatcher(rawArgs)) {
    await runMain(dispatcher, { rawArgs, showUsage: showPlainUsage })
  } else {
    await runMain(build, { rawArgs, showUsage: showPlainUsage })
  }
}

function normalizeRawArgs(rawArgs: string[]): string[] {
  return rawArgs.length === 1 && rawArgs[0] === '-v' ? ['--version'] : rawArgs
}

function shouldUseDispatcher(rawArgs: string[]): boolean {
  if (rawArgs.includes('--help') || rawArgs.includes('-h')) return true

  const first = rawArgs[0]
  return first !== undefined && !first.startsWith('-')
}

function isVersionRequest(rawArgs: string[]): boolean {
  return rawArgs.length === 1 && rawArgs[0] === '--version'
}

async function showPlainUsage<T extends ArgsDef = ArgsDef>(cmd: CommandDef<T>, parent?: CommandDef<T>): Promise<void> {
  console.log(`${await renderUsage(cmd, parent)}\n`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = ExitCode.UsageError
})
