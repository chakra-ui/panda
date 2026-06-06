import { defineCommand } from 'citty'
import { createNodeDriver } from '@pandacss/compiler'
import {
  consoleOutput,
  createCommandOutput,
  renderCommandDiagnostics,
  resolveCwd,
  shouldPrintHumanSummary,
  shouldPrintJson,
  type OutputSink,
} from '../output'
import { renderTimings, timeAsync } from '../timing'
import { startCommandTracing } from '../tracing'
import {
  configLoadDiagnostic,
  countErrors,
  diagnosticsPass,
  missingConfigDiagnostic,
  normalizeDiagnostics,
} from '../diagnostics'
import { createResult, setExitCode, toJsonPayload } from '../result'
import type { CommandContext, PhaseTimings, ValidateFlags, ValidateResult } from '../types'

export function validateCommand(ctx: CommandContext) {
  return defineCommand({
    meta: {
      name: 'validate',
      description: 'Validate Panda configuration and compiler diagnostics',
    },
    args: {
      cwd: { type: 'string', description: 'Current working directory', default: ctx.cwd },
      config: { type: 'string', description: 'Path to panda config file', alias: 'c' },
      json: { type: 'boolean', description: 'Print JSON' },
      format: { type: 'string', description: 'Diagnostic output format: human, pretty, json, or github' },
      quiet: { type: 'boolean', description: 'Suppress warning diagnostics in terminal output' },
      maxWarnings: { type: 'string', description: 'Fail when warning diagnostics exceed this count' },
      verbose: { type: 'boolean', description: 'Print phase timings and operational messages' },
      logfile: { type: 'string', description: 'Write human output to a log file' },
      trace: { type: 'boolean', description: 'Enable compiler tracing' },
      traceOutput: { type: 'string', description: 'Trace output: fmt or chrome-json' },
      traceFile: { type: 'string', description: 'Trace output file for chrome-json tracing' },
      silent: { type: 'boolean', description: 'Suppress all messages except errors' },
    },
    run: async ({ args }) => setExitCode(await runValidate(args as ValidateFlags)),
  })
}

export async function runValidate(
  flags: ValidateFlags = {},
  output: OutputSink = consoleOutput,
): Promise<ValidateResult> {
  const startedAt = performance.now()
  const cwd = resolveCwd(flags.cwd)
  const commandOutput = createCommandOutput(output, flags, cwd)
  const timings: PhaseTimings = {}
  const stopTracing = startCommandTracing(flags, cwd, commandOutput)
  const missingConfig = missingConfigDiagnostic(flags.config, cwd)

  let driver

  if (missingConfig) {
    const diagnostics = [missingConfig]
    const result: ValidateResult = createResult(
      'validate',
      startedAt,
      { timings, diagnosticCount: diagnostics.length, errors: diagnostics.length },
      diagnostics,
      false,
    )

    if (shouldPrintJson(flags)) {
      output.log(JSON.stringify(toJsonPayload(result), null, 2))
    } else if (!flags.silent) {
      renderCommandDiagnostics(diagnostics, commandOutput, flags, cwd)
      renderTimings('validate', timings, commandOutput, flags)
    }

    stopTracing()

    return result
  }

  try {
    driver = await timeAsync(timings, 'config', () => createNodeDriver({ cwd, configPath: flags.config }))
  } catch (error) {
    const diagnostics = [configLoadDiagnostic(error, { cwd, file: flags.config })]
    const result: ValidateResult = createResult(
      'validate',
      startedAt,
      { timings, diagnosticCount: diagnostics.length, errors: diagnostics.length },
      diagnostics,
      false,
    )

    if (shouldPrintJson(flags)) {
      output.log(JSON.stringify(toJsonPayload(result), null, 2))
    } else if (!flags.silent) {
      renderCommandDiagnostics(diagnostics, commandOutput, flags, cwd)
      renderTimings('validate', timings, commandOutput, flags)
    }

    stopTracing()

    return result
  }

  const diagnostics = normalizeDiagnostics(driver.compiler.diagnostics(), { cwd })
  const errors = countErrors(diagnostics)

  const result: ValidateResult = createResult(
    'validate',
    startedAt,
    {
      driver,
      timings,
      configPath: driver.configPath,
      diagnosticCount: diagnostics.length,
      errors,
    },
    diagnostics,
    diagnosticsPass(diagnostics, flags.maxWarnings),
  )

  if (shouldPrintJson(flags)) {
    output.log(JSON.stringify(toJsonPayload(result), null, 2))
  } else if (!flags.silent) {
    if (diagnostics.length > 0) {
      renderCommandDiagnostics(diagnostics, commandOutput, flags, cwd)
    }
    if (shouldPrintHumanSummary(flags)) {
      commandOutput.log(errors > 0 ? `validate: ${errors} errors` : `validate: ok (${diagnostics.length} diagnostics)`)
    }
    renderTimings('validate', timings, commandOutput, flags)
  }

  stopTracing()
  return result
}
