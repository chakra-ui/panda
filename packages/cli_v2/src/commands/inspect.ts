import { defineCommand } from 'citty'
import { createNodeDriver, type Driver } from '@pandacss/compiler'
import {
  consoleOutput,
  createCommandOutput,
  renderCommandDiagnostics,
  resolveCwd,
  shouldPrintJson,
  type OutputSink,
} from '../output'
import { renderTimings, timeAsync } from '../timing'
import { startCommandTracing } from '../tracing'
import { configLoadDiagnostic, diagnosticsPass, missingConfigDiagnostic, normalizeDiagnostics } from '../diagnostics'
import { createResult, setExitCode, toJsonPayload } from '../result'
import type { CommandContext, InspectFlags, InspectResult, InspectSummary, PhaseTimings } from '../types'

export function inspectCommand(ctx: CommandContext) {
  return defineCommand({
    meta: {
      name: 'inspect',
      description: 'Inspect v2 compiler state',
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
    },
    run: async ({ args }) => setExitCode(await runInspect(args as InspectFlags)),
  })
}

export async function runInspect(flags: InspectFlags = {}, output: OutputSink = consoleOutput): Promise<InspectResult> {
  const startedAt = performance.now()
  const cwd = resolveCwd(flags.cwd)
  const commandOutput = createCommandOutput(output, flags, cwd)
  const timings: PhaseTimings = {}
  const stopTracing = startCommandTracing(flags, cwd, commandOutput)
  const missingConfig = missingConfigDiagnostic(flags.config, cwd)

  let driver

  if (missingConfig) {
    const diagnostics = [missingConfig]
    const result: InspectResult = createResult({
      command: 'inspect',
      startedAt,
      data: {
        timings,
        sourceCount: 0,
        watchDirs: [],
        artifactIds: [],
        conditionCount: 0,
        tokenCategoryCount: 0,
        utilityCount: 0,
      },
      diagnostics,
      ok: false,
    })

    if (shouldPrintJson(flags)) {
      output.log(JSON.stringify(toJsonPayload(result), null, 2))
    } else {
      renderCommandDiagnostics(diagnostics, commandOutput, flags, cwd)
      renderTimings('inspect', timings, commandOutput, flags)
    }

    stopTracing()

    return result
  }

  try {
    driver = await timeAsync(timings, 'config', () => createNodeDriver({ cwd, configPath: flags.config }))
  } catch (error) {
    const diagnostics = [configLoadDiagnostic(error, { cwd, file: flags.config })]
    const result: InspectResult = createResult({
      command: 'inspect',
      startedAt,
      data: {
        timings,
        sourceCount: 0,
        watchDirs: [],
        artifactIds: [],
        conditionCount: 0,
        tokenCategoryCount: 0,
        utilityCount: 0,
      },
      diagnostics,
      ok: false,
    })

    if (shouldPrintJson(flags)) {
      output.log(JSON.stringify(toJsonPayload(result), null, 2))
    } else {
      renderCommandDiagnostics(diagnostics, commandOutput, flags, cwd)
      renderTimings('inspect', timings, commandOutput, flags)
    }

    stopTracing()

    return result
  }

  const diagnostics = normalizeDiagnostics(driver.compiler.diagnostics(), { cwd })

  const result: InspectResult = createResult({
    command: 'inspect',
    startedAt,
    data: { timings, ...inspectDriver(driver) },
    diagnostics,
    ok: diagnosticsPass(diagnostics, flags.maxWarnings),
  })

  if (shouldPrintJson(flags)) {
    output.log(JSON.stringify(toJsonPayload(result), null, 2))
  } else {
    commandOutput.log(
      [
        `config: ${result.configPath ?? '<none>'}`,
        `sources: ${result.sourceCount}`,
        `watch dirs: ${result.watchDirs.length}`,
        `artifacts: ${result.artifactIds.join(', ')}`,
        `conditions: ${result.conditionCount}`,
        `token categories: ${result.tokenCategoryCount}`,
        `utilities: ${result.utilityCount}`,
      ].join('\n'),
    )
    renderCommandDiagnostics(diagnostics, commandOutput, flags, cwd)
    renderTimings('inspect', timings, commandOutput, flags)
  }

  stopTracing()
  return result
}

export function inspectDriver(driver: Driver): InspectSummary {
  const spec = driver.introspect.spec
  const targets = driver.watchTargets()
  return {
    configPath: driver.configPath,
    sourceCount: targets.sources.length,
    watchDirs: targets.dirs,
    artifactIds: driver
      .artifacts()
      .map((artifact) => artifact.id)
      .sort(),
    conditionCount: driver.introspect.conditions().length,
    tokenCategoryCount: Object.keys(spec.tokens.categories).length,
    utilityCount: Object.keys(spec.utilities.properties).length,
  }
}
