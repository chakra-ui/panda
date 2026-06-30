import { defineCommand } from 'citty'
import { rmSync } from 'node:fs'
import { type DiffConfigResult } from '@pandacss/compiler'
import { baseArgs, outputArgs, parseCliFlags, traceArgs } from '../args'
import { checkExpectedFiles, formatCheckSummary, isCheckClean } from '../check'
import { codegenFlagsSchema } from '../schema'
import { runCommand } from '../run-command'
import { diagnosticsPass, normalizeDiagnostics } from '../diagnostics'
import { consoleOutput, renderCommandDiagnostics, shouldPrintHumanSummary, type OutputSink } from '../output'
import { parseMilliseconds, timeAsync } from '../timing'
import { setExitCode } from '../result'
import type { CheckOutput, CodegenFlags, CodegenResult, RunContext } from '../schema'
import { formatWatchError, startProjectWatch } from '../watch'
import { createWatchLogger } from '../watch-logger'

export const codegenCommand = defineCommand({
  meta: {
    name: 'codegen',
    description: 'Generate the panda system',
  },
  args: () => ({
    ...baseArgs(),
    watch: { type: 'boolean', description: 'Watch files and rebuild', alias: 'w' },
    outdir: { type: 'string', description: 'Output directory for generated files' },
    clean: { type: 'boolean', description: 'Clean the output directory before generating' },
    ...outputArgs(),
    ...traceArgs(),
    'watch-debounce': { type: 'string', description: 'Watch rebuild debounce in milliseconds' },
    check: { type: 'boolean', description: 'Check generated files without writing' },
  }),
  run: async ({ args }) => setExitCode(await runCodegen(parseCliFlags(codegenFlagsSchema, args))),
})

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
    const watchLogger = createWatchLogger(runCtx.output)
    const stopWatch = await startProjectWatch({
      driver: result.driver!,
      cwd: runCtx.cwd,
      outdir: () => result.driver!.getOutdir(flags.outdir),
      debounceMs: parseMilliseconds(flags.watchDebounce),
      onStatus: (message) => watchLogger.log(message),
      onError: (error) => watchLogger.error(`panda: failed to process watch batch\n${formatWatchError(error)}`),
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

export async function codegenOnce(
  ctx: RunContext,
  flags: CodegenFlags,
  _diff?: DiffConfigResult,
): Promise<CheckOutput> {
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
      path: ctx.driver.compiler.path.join([outdir, file.path]),
      code: file.code,
    })),
  )

  return checkExpectedFiles(expected)
}
