import { defineCommand } from 'citty'
import { type ParseFileReport } from '@pandacss/compiler'
import { checkExpectedFiles, formatCheckSummary, isCheckClean } from '../check'
import { runCommand } from '../run-command'
import { collectParseDiagnostics, diagnosticsPass, normalizeDiagnostics } from '../diagnostics'
import { consoleOutput, renderCommandDiagnostics, shouldPrintHumanSummary, type OutputSink } from '../output'
import { parseMilliseconds, time } from '../timing'
import { setExitCode } from '../result'
import type { CommandContext, CssgenFlags, CssgenResult, RunContext } from '../types'
import { formatWatchError, startProjectWatch } from '../watch'

export function cssgenCommand(ctx: CommandContext) {
  return defineCommand({
    meta: {
      name: 'cssgen',
      description: 'Generate CSS from project files',
    },
    args: {
      cwd: { type: 'string', description: 'Current working directory', default: ctx.cwd },
      config: { type: 'string', description: 'Path to panda config file', alias: 'c' },
      watch: { type: 'boolean', description: 'Watch files and rebuild', alias: 'w' },
      outfile: { type: 'string', description: 'Output file for extracted CSS', alias: 'o' },
      splitting: { type: 'boolean', description: 'Emit split CSS files' },
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
      check: { type: 'boolean', description: 'Check generated CSS without writing' },
    },
    run: async ({ args }) => setExitCode(await runCssgen(args as CssgenFlags)),
  })
}

export async function runCssgen(flags: CssgenFlags = {}, output: OutputSink = consoleOutput): Promise<CssgenResult> {
  let runCtx: RunContext | undefined
  let resolveOutfile: () => string
  let resolveOutdir: () => string

  const result = (await runCommand({
    command: 'cssgen',
    flags,
    output,
    keepTracing: !!(flags.watch && !flags.check),
    failData: (diagnostics) => ({
      parsed: [],
      cssBytes: 0,
      diagnosticCount: diagnostics.length,
      missing: [],
      stale: [],
    }),
    async execute(ctx) {
      resolveOutfile = () =>
        flags.splitting || !flags.outfile ? ctx.driver.paths().styleFile : ctx.driver.resolvePath(flags.outfile!)
      resolveOutdir = () => ctx.driver.paths().root

      const outdir = resolveOutdir()
      const outfile = resolveOutfile()
      runCtx = { driver: ctx.driver, cwd: ctx.cwd, outdir, output: ctx.output, timings: ctx.timings }

      const current = await cssgenOnce(runCtx, outfile, flags)

      return {
        data: { outfile, ...current },
        diagnostics: current.diagnostics,
        ok: diagnosticsPass(current.diagnostics, flags.maxWarnings) && isCheckClean(current),
      }
    },
    renderHuman(ctx, commandResult) {
      renderCommandDiagnostics(commandResult.diagnostics, ctx.output, flags, ctx.cwd)
    },
  })) as CssgenResult

  if (flags.watch && !flags.check && runCtx) {
    let current = {
      parsed: result.parsed,
      cssBytes: result.cssBytes,
      diagnosticCount: result.diagnosticCount,
      diagnostics: result.diagnostics,
      missing: result.missing,
      stale: result.stale,
    }

    const stopWatch = await startProjectWatch({
      driver: result.driver!,
      cwd: runCtx.cwd,
      outdir: resolveOutdir!,
      debounceMs: parseMilliseconds(flags.watchDebounce),
      onStatus: (message) => runCtx!.output.log(message),
      onError: (error) => runCtx!.output.error?.(`panda: failed to process watch batch\n${formatWatchError(error)}`),
      onSourceChange: async (events) => {
        result.driver!.applyChanges(events)

        current = await writeCssgenOutput(runCtx!, resolveOutfile!(), flags, current.parsed)
        Object.assign(result, current)
      },
      onConfigChange: async () => {
        const diff = await result.driver!.reload()

        if (diff.hasChanged) {
          runCtx!.outdir = resolveOutdir!()
          const outfile = resolveOutfile!()
          result.outfile = outfile

          current = await cssgenOnce(runCtx!, outfile, flags)
          Object.assign(result, current)
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

// `cssFiles` is the count of CSS files written or checked — 1 by default, N under `--splitting` —
// so callers (e.g. the build summary) can report it without assuming a single styles.css.
type CssgenOnceResult = Pick<
  CssgenResult,
  'parsed' | 'cssBytes' | 'diagnosticCount' | 'diagnostics' | 'missing' | 'stale'
> & { cssFiles: number }

export async function cssgenOnce(ctx: RunContext, outfile: string, flags: CssgenFlags): Promise<CssgenOnceResult> {
  const parsed = time({ timings: ctx.timings, phase: 'parse', run: () => ctx.driver.parseFiles() })

  if (flags.check) {
    return time({ timings: ctx.timings, phase: 'check', run: () => checkCssgenOutput(ctx, outfile, flags, parsed) })
  }

  return writeCssgenOutput(ctx, outfile, flags, parsed)
}

export async function writeCssgenOutput(
  ctx: RunContext,
  outfile: string,
  flags: CssgenFlags,
  parsed: ParseFileReport[],
): Promise<CssgenOnceResult> {
  const parseDiagnostics = collectParseDiagnostics(parsed, ctx.cwd)

  if (flags.splitting) {
    const output = time({ timings: ctx.timings, phase: 'write', run: () => ctx.driver.writeSplitCss() })
    const cssBytes = output.files.reduce((total, file) => total + Buffer.byteLength(file.code), 0)

    if (shouldPrintHumanSummary(flags)) {
      ctx.output.log(`cssgen: parsed ${parsed.length} files, wrote ${output.files.length} files to ${output.root}`)
    }

    return {
      parsed,
      cssBytes,
      diagnosticCount: parseDiagnostics.length,
      diagnostics: parseDiagnostics,
      cssFiles: output.files.length,
      missing: [],
      stale: [],
    }
  }

  const output = time({ timings: ctx.timings, phase: 'write', run: () => ctx.driver.writeCss(outfile) })
  const cssBytes = Buffer.byteLength(output.css)
  const diagnostics = normalizeDiagnostics([...parseDiagnostics, ...output.diagnostics], { cwd: ctx.cwd })

  if (shouldPrintHumanSummary(flags)) {
    ctx.output.log(
      `cssgen: parsed ${parsed.length} files, wrote ${cssBytes} bytes to ${output.path}, diagnostics: ${output.diagnostics.length}`,
    )
  }

  return {
    parsed,
    cssBytes,
    diagnosticCount: diagnostics.length,
    diagnostics,
    cssFiles: 1,
    missing: [],
    stale: [],
  }
}

function checkCssgenOutput(
  ctx: RunContext,
  outfile: string,
  flags: CssgenFlags,
  parsed: ParseFileReport[],
): CssgenOnceResult {
  const parseDiagnostics = collectParseDiagnostics(parsed, ctx.cwd)

  if (flags.splitting) {
    const files = time({ timings: ctx.timings, phase: 'emit', run: () => ctx.driver.splitCss() })
    const check = checkExpectedFiles(
      files.map((file) => ({
        path: ctx.driver.compiler.joinPath([ctx.outdir, file.path]),
        code: file.code,
      })),
    )
    const cssBytes = files.reduce((total, file) => total + Buffer.byteLength(file.code), 0)

    if (shouldPrintHumanSummary(flags)) {
      ctx.output.log(formatCheckSummary('cssgen', check, ctx.outdir))
    }

    return {
      parsed,
      cssBytes,
      diagnosticCount: parseDiagnostics.length,
      diagnostics: parseDiagnostics,
      cssFiles: check.files.length,
      ...check,
    }
  }

  const output = time({ timings: ctx.timings, phase: 'emit', run: () => ctx.driver.cssgen() })
  const cssBytes = Buffer.byteLength(output.css)
  const diagnostics = normalizeDiagnostics([...parseDiagnostics, ...output.diagnostics], { cwd: ctx.cwd })
  const check = checkExpectedFiles([{ path: outfile, code: output.css }])

  if (shouldPrintHumanSummary(flags)) {
    ctx.output.log(formatCheckSummary('cssgen', check, outfile))
  }

  return {
    parsed,
    cssBytes,
    diagnosticCount: diagnostics.length,
    diagnostics,
    cssFiles: check.files.length,
    ...check,
  }
}
