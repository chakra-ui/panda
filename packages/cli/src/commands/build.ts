import { defineCommand, type ArgsDef } from 'citty'
import { isCheckClean } from '../check'
import { runCommand } from '../run-command'
import { type CliDiagnostic, dedupeDiagnostics, diagnosticsPass, normalizeDiagnostics } from '../diagnostics'
import { consoleOutput, renderCommandDiagnostics, shouldPrintHumanSummary, type OutputSink } from '../output'
import { parseMilliseconds, timeAsync } from '../timing'
import { setExitCode } from '../result'
import type { BuildFlags, BuildResult, CommandContext, RunContext } from '../types'
import { codegenOnce } from './codegen'
import { cssgenOnce } from './cssgen'
import { formatWatchError, startProjectWatch } from '../watch'

// Shared so the dispatcher in cli-main.ts can render these flags under `panda --help`,
// where the default build is reachable but its command object lives outside the subcommand tree.
export function buildArgs(ctx: CommandContext): ArgsDef {
  return {
    cwd: { type: 'string', description: 'Current working directory', default: ctx.cwd },
    config: { type: 'string', description: 'Path to panda config file', alias: 'c' },
    watch: { type: 'boolean', description: 'Watch files and rebuild', alias: 'w' },
    outdir: { type: 'string', description: 'Output directory for generated files' },
    outfile: { type: 'string', description: 'Output file for extracted CSS', alias: 'o' },
    splitting: { type: 'boolean', description: 'Emit split CSS files' },
    clean: { type: 'boolean', description: 'Clean the output directory before generating' },
    silent: { type: 'boolean', description: 'Suppress all messages except errors' },
    json: { type: 'boolean', description: 'Print JSON' },
    format: { type: 'string', description: 'Diagnostic output format: human, pretty, json, or github' },
    quiet: { type: 'boolean', description: 'Suppress warning diagnostics in terminal output' },
    maxWarnings: { type: 'string', description: 'Fail when warning diagnostics exceed this count' },
    verbose: { type: 'boolean', description: 'Print phase timings and operational messages' },
    logfile: { type: 'string', description: 'Write human output to a log file' },
    trace: { type: 'boolean', description: 'Enable compiler tracing' },
    traceOutput: { type: 'string', description: 'Trace output: fmt or chrome-json' },
    traceFile: { type: 'string', description: 'Trace output file for chrome-json tracing' },
    watchDebounce: { type: 'string', description: 'Watch rebuild debounce in milliseconds' },
    check: { type: 'boolean', description: 'Check generated files without writing' },
  }
}

export function buildCommand(ctx: CommandContext) {
  return defineCommand({
    meta: {
      name: 'panda',
      description: 'Generate the panda system and CSS (codegen + cssgen)',
    },
    args: buildArgs(ctx),
    run: async ({ args }) => setExitCode(await runBuild(args as BuildFlags)),
  })
}

export async function runBuild(flags: BuildFlags = {}, output: OutputSink = consoleOutput): Promise<BuildResult> {
  let runCtx: RunContext | undefined
  let resolveOutfile: () => string
  let resolveOutdir: () => string

  const result = (await runCommand({
    command: 'build',
    flags,
    output,
    keepTracing: !!(flags.watch && !flags.check),
    failData: (diagnostics) => ({
      files: [],
      parsed: [],
      cssBytes: 0,
      diagnosticCount: diagnostics.length,
      missing: [],
      stale: [],
    }),
    async execute(ctx) {
      resolveOutdir = () => ctx.driver.getOutdir(flags.outdir)
      // `--outdir` relocates the default CSS file too, so codegen and css output stay under one root.
      resolveOutfile = () =>
        flags.splitting || !flags.outfile
          ? ctx.driver.paths(flags.outdir).styleFile
          : ctx.driver.resolvePath(flags.outfile!)

      const outdir = resolveOutdir()
      const outfile = resolveOutfile()
      runCtx = { driver: ctx.driver, cwd: ctx.cwd, outdir, output: ctx.output, timings: ctx.timings }

      const current = await buildOnce(runCtx, outfile, flags)

      return {
        data: { outdir, outfile, ...current },
        diagnostics: current.diagnostics,
        ok: diagnosticsPass(current.diagnostics, flags.maxWarnings) && isCheckClean(current),
      }
    },
    renderHuman(ctx, commandResult) {
      renderCommandDiagnostics(commandResult.diagnostics, ctx.output, flags, ctx.cwd)
    },
  })) as BuildResult

  if (flags.watch && !flags.check && runCtx) {
    const stopWatch = await startProjectWatch({
      driver: result.driver!,
      cwd: runCtx.cwd,
      outdir: resolveOutdir!,
      debounceMs: parseMilliseconds(flags.watchDebounce),
      onStatus: (message) => runCtx!.output.log(message),
      onError: (error) => runCtx!.output.error?.(`panda: failed to process watch batch\n${formatWatchError(error)}`),
      onSourceChange: async (events) => {
        result.driver!.applyChanges(events)
        Object.assign(result, await buildOnce(runCtx!, resolveOutfile!(), flags))
      },
      onConfigChange: async () => {
        const diff = await result.driver!.reload()

        if (diff.hasChanged) {
          runCtx!.outdir = resolveOutdir!()
          result.outdir = runCtx!.outdir
          result.outfile = resolveOutfile!()
          Object.assign(result, await buildOnce(runCtx!, result.outfile, flags))
        }
      },
    })

    const stopTracing = result.stop
    result.stop = async () => {
      await stopWatch()
      await stopTracing?.()
    }
  }

  return result
}

type BuildOnceResult = Pick<BuildResult, 'files' | 'parsed' | 'cssBytes' | 'diagnosticCount' | 'missing' | 'stale'> & {
  diagnostics: CliDiagnostic[]
}

async function buildOnce(ctx: RunContext, outfile: string, flags: BuildFlags): Promise<BuildOnceResult> {
  // The sub-passes print their own per-command summaries; suppress them so build emits one combined line.
  const subFlags = { ...flags, silent: true }

  // codegen runs first so `--clean` wipes the outdir before cssgen writes CSS into it.
  const codegen = await timeAsync({
    timings: ctx.timings!,
    phase: flags.check ? 'check' : 'codegen',
    run: () => codegenOnce(ctx, subFlags),
  })
  const css = await cssgenOnce(ctx, outfile, subFlags)

  // compiler diagnostics need normalizing; css.diagnostics are already normalized — just dedupe the union.
  const diagnostics = dedupeDiagnostics([
    ...normalizeDiagnostics(ctx.driver.compiler.diagnostics(), { cwd: ctx.cwd }),
    ...css.diagnostics,
  ])

  const missing = [...codegen.missing, ...css.missing]
  const stale = [...codegen.stale, ...css.stale]

  if (shouldPrintHumanSummary(flags)) {
    ctx.output.log(
      flags.check
        ? `panda: checked ${codegen.files.length + css.cssFiles} files (missing ${missing.length}, stale ${stale.length})`
        : `panda: generated ${codegen.files.length} files, wrote ${css.cssBytes} bytes of CSS`,
    )
  }

  return {
    files: codegen.files,
    parsed: css.parsed,
    cssBytes: css.cssBytes,
    diagnosticCount: diagnostics.length,
    diagnostics,
    missing,
    stale,
  }
}
