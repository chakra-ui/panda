import { defineCommand } from 'citty'
import { createNodeDriver, type ConfigDiff } from '@pandacss/compiler'
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
import { parseMilliseconds, renderTimings, timeAsync } from '../timing'
import { startCommandTracing } from '../tracing'
import { configLoadDiagnostic, diagnosticsPass, missingConfigDiagnostic, normalizeDiagnostics } from '../diagnostics'
import { createResult, setExitCode, toJsonPayload } from '../result'
import type { CheckOutput, CodegenFlags, CodegenResult, CommandContext, PhaseTimings, RunContext } from '../types'
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
  const startedAt = performance.now()
  const cwd = resolveCwd(flags.cwd)
  const commandOutput = createCommandOutput(output, flags, cwd)
  const timings: PhaseTimings = {}
  const stopTracing = startCommandTracing(flags, cwd, commandOutput)
  const missingConfig = missingConfigDiagnostic(flags.config, cwd)

  let driver

  if (missingConfig) {
    const diagnostics = [missingConfig]
    const result: CodegenResult = createResult({
      command: 'codegen',
      startedAt,
      data: { timings, files: [], missing: [], stale: [] },
      diagnostics,
      ok: false,
    })

    if (shouldPrintJson(flags)) {
      output.log(JSON.stringify(toJsonPayload(result), null, 2))
    } else {
      renderCommandDiagnostics(diagnostics, commandOutput, flags, cwd)
      renderTimings('codegen', timings, commandOutput, flags)
    }

    stopTracing()

    return result
  }

  try {
    driver = await timeAsync(timings, 'config', () => createNodeDriver({ cwd, configPath: flags.config }))
  } catch (error) {
    const diagnostics = [configLoadDiagnostic(error, { cwd, file: flags.config })]
    const result: CodegenResult = createResult({
      command: 'codegen',
      startedAt,
      data: { timings, files: [], missing: [], stale: [] },
      diagnostics,
      ok: false,
    })

    if (shouldPrintJson(flags)) {
      output.log(JSON.stringify(toJsonPayload(result), null, 2))
    } else {
      renderCommandDiagnostics(diagnostics, commandOutput, flags, cwd)
      renderTimings('codegen', timings, commandOutput, flags)
    }

    stopTracing()

    return result
  }

  const outdir = driver.getOutdir(flags.outdir)

  const ctx: RunContext = { driver, cwd, outdir, output: commandOutput, timings }

  const current = await timeAsync(timings, flags.check ? 'check' : 'codegen', () => codegenOnce(ctx, flags))
  const diagnostics = normalizeDiagnostics(driver.compiler.diagnostics(), { cwd })
  const ok = diagnosticsPass(diagnostics, flags.maxWarnings) && isCheckClean(current)

  const result: CodegenResult = createResult({
    command: 'codegen',
    startedAt,
    data: { driver, outdir, timings, ...current },
    diagnostics,
    ok,
  })

  if (shouldPrintJson(flags)) {
    output.log(JSON.stringify(toJsonPayload(result), null, 2))
  } else {
    renderCommandDiagnostics(diagnostics, commandOutput, flags, cwd)
    renderTimings('codegen', timings, commandOutput, flags)
  }

  if (flags.watch && !flags.check) {
    // Keep tracing alive until watch mode is explicitly stopped.
    const stopWatch = await startProjectWatch({
      driver,
      cwd,
      outdir: () => driver.getOutdir(flags.outdir),
      debounceMs: parseMilliseconds(flags.watchDebounce),
      onStatus: (message) => commandOutput.log(message),
      onError: (error) => commandOutput.error?.(`panda: failed to process watch batch\n${formatWatchError(error)}`),
      onSourceChange: async (events) => {
        driver.applyChanges(events)

        await codegenOnce(ctx, flags)
      },
      onConfigChange: async () => {
        const diff = await driver.reload()

        if (diff.hasChanged) {
          result.outdir = driver.getOutdir(flags.outdir)

          await codegenOnce(ctx, flags, diff)
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

async function codegenOnce(ctx: RunContext, flags: CodegenFlags, _diff?: ConfigDiff): Promise<CheckOutput> {
  const outdir = ctx.driver.getOutdir(flags.outdir)
  if (flags.check) {
    const result = checkCodegenOutput(ctx, outdir)

    if (shouldPrintHumanSummary(flags)) {
      ctx.output.log(formatCheckSummary('codegen', result, outdir))
    }

    return result
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
