import { defineCommand, renderUsage, runMain, type ArgsDef, type CommandDef } from 'citty'
import { ExitCode } from './result'
import { readCliVersion } from './version'

export async function main(argv = process.argv): Promise<void> {
  const rawArgs = normalizeRawArgs(argv.slice(2))
  const version = readCliVersion()

  if (isVersionRequest(rawArgs)) {
    console.log(version)
    return
  }

  if (rawArgs[0] === 'studio') {
    const studio = await import('./commands/studio')
    if (rawArgs[1] === 'generate') {
      await runMain(studio.studioGenerateCommand, { rawArgs: rawArgs.slice(2), showUsage: showPlainUsage })
    } else {
      await runMain(studio.studioCommand, { rawArgs: rawArgs.slice(1), showUsage: showPlainUsage })
    }
    return
  }

  // Defer command modules so each path only pays for what it runs (Clack, analyze
  // report, watcher, compiler driver graph, etc.).
  if (shouldUseDispatcher(rawArgs)) {
    const dispatcher = defineCommand({
      meta: {
        name: 'panda',
        version,
        description: 'Generate the panda system and CSS. Run with no subcommand for the full build.',
      },
      // Root args document the default build; resolved only when citty needs them.
      // `buildArgs` is a factory — call it after the dynamic import.
      args: () => import('./commands/build').then((m) => m.buildArgs()),
      subCommands: {
        init: () => import('./commands/init').then((m) => m.initCommand),
        dev: () => import('./commands/build').then((m) => m.devCommand),
        build: () => import('./commands/build').then((m) => m.buildSubcommand),
        check: () => import('./commands/build').then((m) => m.checkCommand),
        info: () => import('./commands/info').then((m) => m.infoCommand),
        doctor: () => import('./commands/doctor').then((m) => m.doctorCommand),
        debug: () => import('./commands/debug').then((m) => m.debugCommand),
        buildinfo: () => import('./commands/buildinfo').then((m) => m.buildinfoCommand),
        lib: () => import('./commands/lib').then((m) => m.libCommand),
        analyze: () => import('./commands/analyze').then((m) => m.analyzeCommand),
        codegen: () => import('./commands/codegen').then((m) => m.codegenCommand),
        cssgen: () => import('./commands/cssgen').then((m) => m.cssgenCommand),
        studio: () => import('./commands/studio').then((m) => m.studioCommand),
      },
    })

    // Runless on purpose: citty runs a root's `run` even after a subcommand matches,
    // which would re-run the build on top of every subcommand.
    await runMain(dispatcher, { rawArgs, showUsage: showPlainUsage })
    return
  }

  // The default `panda` (no subcommand) runs the full build.
  const { buildCommand } = await import('./commands/build')
  await runMain(buildCommand, { rawArgs, showUsage: showPlainUsage })
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
