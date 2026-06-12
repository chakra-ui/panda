import { defineCommand } from 'citty'
import { rmSync } from 'node:fs'
import { type ConfigDiff } from '@pandacss/compiler'
import { checkExpectedFiles, formatCheckSummary, isCheckClean } from '../check'
import { runCommand } from '../run-command'
import { diagnosticsPass, normalizeDiagnostics } from '../diagnostics'
import { consoleOutput, renderCommandDiagnostics, shouldPrintHumanSummary, type OutputSink } from '../output'
import { parseMilliseconds, timeAsync } from '../timing'
import { setExitCode } from '../result'
import type { CheckOutput, CodegenFlags, CodegenResult, CommandContext, RunContext } from '../types'
import { formatWatchError, startProjectWatch } from '../watch'

export function codegenCommand(ctx: CommandContext) {
  return defineCommand({
    meta: {
      name: 'codegen',
      description: 'Generate the panda system',
    },
    args: {
      cwd: { type: 'string', description: 'Current working directory', default: ctx.cwd },
      config: { type: 'string', description: 'Path to panda config file', alias: 'c' },
      watch: { type: 'boolean', description: 'Watch files and rebuild', alias: 'w' },
      outdir: { type: 'string', description: 'Output directory for generated files' },
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
    },
    run: async ({ args }) => setExitCode(await runCodegen(args as CodegenFlags)),
  })
}

export async function runCodegen(flags: CodegenFlags = {}, output: OutputSink = consoleOutput): Promise<CodegenResult> {
  let runCtx: RunContext | undefined

  const result = (await runCommand({
    command: 'codegen',
    flags,
    output,
    keepTracing: !!(flags.watch && !flags.check),
    failData: () => ({ files: [], missing: [], stale: [] }),
    async execute(ctx) {
      const outdir = ctx.driver.getOutdir(flags.outdir)
      runCtx = { driver: ctx.driver, cwd: ctx.cwd, outdir, output: ctx.output, timings: ctx.timings }

      const current = await timeAsync({
        timings: ctx.timings,
        phase: flags.check ? 'check' : 'codegen',
        run: () => codegenOnce(runCtx!, flags),
      })
      const diagnostics = normalizeDiagnostics(ctx.driver.compiler.diagnostics(), { cwd: ctx.cwd })

      return {
        data: { outdir, ...current },
        diagnostics,
        ok: diagnosticsPass(diagnostics, flags.maxWarnings) && isCheckClean(current),
      }
    },
    renderHuman(ctx, commandResult) {
      renderCommandDiagnostics(commandResult.diagnostics, ctx.output, flags, ctx.cwd)
    },
  })) as CodegenResult

  if (flags.watch && !flags.check && runCtx) {
    const stopWatch = await startProjectWatch({
      driver: result.driver!,
      cwd: runCtx.cwd,
      outdir: () => result.driver!.getOutdir(flags.outdir),
      debounceMs: parseMilliseconds(flags.watchDebounce),
      onStatus: (message) => runCtx!.output.log(message),
      onError: (error) => runCtx!.output.error?.(`panda: failed to process watch batch\n${formatWatchError(error)}`),
      onSourceChange: async (events) => {
        result.driver!.applyChanges(events)
        await codegenOnce(runCtx!, flags)
      },
      onConfigChange: async () => {
        const diff = await result.driver!.reload()

        if (diff.hasChanged) {
          result.outdir = result.driver!.getOutdir(flags.outdir)
          runCtx!.outdir = result.outdir
          await codegenOnce(runCtx!, flags, diff)
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

async function codegenOnce(ctx: RunContext, flags: CodegenFlags, _diff?: ConfigDiff): Promise<CheckOutput> {
  const outdir = ctx.driver.getOutdir(flags.outdir)
  if (flags.check) {
    const result = checkCodegenOutput(ctx, outdir)

    if (shouldPrintHumanSummary(flags)) {
      ctx.output.log(formatCheckSummary('codegen', result, outdir))
    }

    return result
  }

  if (flags.clean) {
    rmSync(outdir, { recursive: true, force: true })
  }

  const files = ctx.driver.codegen({ outdir: flags.outdir })

  if (shouldPrintHumanSummary(flags)) {
    ctx.output.log(`codegen: wrote ${files.length} files to ${outdir}`)
  }

  return { files, missing: [], stale: [] }
}

function checkCodegenOutput(ctx: RunContext, outdir: string): CheckOutput {
  const expected = ctx.driver.artifacts().flatMap((artifact) =>
    artifact.files.map((file) => ({
      path: ctx.driver.compiler.joinPath([outdir, file.path]),
      code: file.code,
    })),
  )

  return checkExpectedFiles(expected)
}
