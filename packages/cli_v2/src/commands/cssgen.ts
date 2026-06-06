import { defineCommand } from 'citty'
import { createNodeDriver, type ParseFileReport } from '@pandacss/compiler'
import { checkExpectedFiles, formatCheckSummary, isCheckClean } from '../check'
import {
  consoleOutput,
  createCommandOutput,
  renderCommandDiagnostics,
  resolveCwd,
  shouldPrintHumanSummary,
  shouldPrintJson,
  type OutputSink,
} from '../output'
import { parseMilliseconds, renderTimings, time, timeAsync } from '../timing'
import { startCommandTracing } from '../tracing'
import { collectParseDiagnostics, diagnosticsPass, normalizeDiagnostics } from '../diagnostics'
import { createResult, setExitCode, toJsonPayload } from '../result'
import type { CommandContext, CssgenFlags, CssgenResult, PhaseTimings, RunContext } from '../types'
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
  const startedAt = performance.now()
  const cwd = resolveCwd(flags.cwd)
  const commandOutput = createCommandOutput(output, flags, cwd)
  const timings: PhaseTimings = {}
  const stopTracing = startCommandTracing(flags, cwd, commandOutput)

  const driver = await timeAsync(timings, 'config', () => createNodeDriver({ cwd, configPath: flags.config }))
  const resolveOutfile = () =>
    flags.splitting || !flags.outfile ? driver.paths().styleFile : driver.resolvePath(flags.outfile)
  const resolveOutdir = () => driver.paths().root

  let outdir = resolveOutdir()
  let outfile = resolveOutfile()

  let current = await cssgenOnce({ driver, cwd, outdir, output: commandOutput, timings }, outfile, flags)
  const ok = diagnosticsPass(current.diagnostics, flags.maxWarnings) && isCheckClean(current)

  const result: CssgenResult = createResult(
    'cssgen',
    startedAt,
    { driver, outfile, timings, ...current },
    current.diagnostics,
    ok,
  )

  if (shouldPrintJson(flags)) {
    output.log(JSON.stringify(toJsonPayload(result), null, 2))
  } else {
    renderCommandDiagnostics(current.diagnostics, commandOutput, flags, cwd)
    renderTimings('cssgen', timings, commandOutput, flags)
  }

  if (flags.watch && !flags.check) {
    // Keep tracing alive until watch mode is explicitly stopped.
    const stopWatch = await startProjectWatch({
      driver,
      cwd,
      outdir: resolveOutdir,
      debounceMs: parseMilliseconds(flags.watchDebounce),
      onStatus: (message) => commandOutput.log(message),
      onError: (error) => commandOutput.error?.(`panda: failed to process watch batch\n${formatWatchError(error)}`),
      onSourceChange: async (events) => {
        driver.applyChanges(events)

        current = await writeCssgenOutput(
          { driver, cwd, outdir, output: commandOutput, timings },
          outfile,
          flags,
          current.parsed,
        )

        Object.assign(result, current)
      },
      onConfigChange: async () => {
        const diff = await driver.reload()

        if (diff.hasChanged) {
          outdir = resolveOutdir()
          outfile = resolveOutfile()

          current = await cssgenOnce({ driver, cwd, outdir, output: commandOutput, timings }, outfile, flags)
          result.outfile = outfile

          Object.assign(result, current)
        }
      },
    })

    result.stop = async () => {
      await stopWatch()
      stopTracing()
    }
  } else {
    stopTracing()
  }

  return result
}

async function cssgenOnce(
  ctx: RunContext,
  outfile: string,
  flags: CssgenFlags,
): Promise<Pick<CssgenResult, 'parsed' | 'cssBytes' | 'diagnosticCount' | 'diagnostics' | 'missing' | 'stale'>> {
  const parsed = time(ctx.timings, 'parse', () => ctx.driver.parseFiles())

  if (flags.check) {
    return time(ctx.timings, 'check', () => checkCssgenOutput(ctx, outfile, flags, parsed))
  }

  return writeCssgenOutput(ctx, outfile, flags, parsed)
}

export async function writeCssgenOutput(
  ctx: RunContext,
  outfile: string,
  flags: CssgenFlags,
  parsed: ParseFileReport[],
): Promise<Pick<CssgenResult, 'parsed' | 'cssBytes' | 'diagnosticCount' | 'diagnostics' | 'missing' | 'stale'>> {
  const parseDiagnostics = collectParseDiagnostics(parsed, ctx.cwd)

  if (flags.splitting) {
    const output = time(ctx.timings, 'write', () => ctx.driver.writeSplitCss())
    const cssBytes = output.files.reduce((total, file) => total + Buffer.byteLength(file.code), 0)

    if (shouldPrintHumanSummary(flags)) {
      ctx.output.log(`cssgen: parsed ${parsed.length} files, wrote ${output.files.length} files to ${output.root}`)
    }

    return {
      parsed,
      cssBytes,
      diagnosticCount: parseDiagnostics.length,
      diagnostics: parseDiagnostics,
      missing: [],
      stale: [],
    }
  }

  const output = time(ctx.timings, 'write', () => ctx.driver.writeCss(outfile))
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
    missing: [],
    stale: [],
  }
}

function checkCssgenOutput(
  ctx: RunContext,
  outfile: string,
  flags: CssgenFlags,
  parsed: ParseFileReport[],
): Pick<CssgenResult, 'parsed' | 'cssBytes' | 'diagnosticCount' | 'diagnostics' | 'missing' | 'stale'> {
  const parseDiagnostics = collectParseDiagnostics(parsed, ctx.cwd)

  if (flags.splitting) {
    const files = time(ctx.timings, 'emit', () => ctx.driver.splitCss())
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
      ...check,
    }
  }

  const output = time(ctx.timings, 'emit', () => ctx.driver.cssgen())
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
    ...check,
  }
}
