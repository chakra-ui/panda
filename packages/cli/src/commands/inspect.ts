import { type Driver } from '@pandacss/compiler'
import { defineCommand } from 'citty'
import { runCommand } from '../run-command'
import { diagnosticsPass, normalizeDiagnostics } from '../diagnostics'
import { consoleOutput, renderCommandDiagnostics, type OutputSink } from '../output'
import { setExitCode } from '../result'
import type { CommandContext, InspectFlags, InspectResult, InspectSummary } from '../types'

export function inspectCommand(ctx: CommandContext) {
  return defineCommand({
    meta: {
      name: 'inspect',
      description: 'Inspect compiler state',
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
  return runCommand({
    command: 'inspect',
    flags,
    output,
    failData: () => ({
      sourceCount: 0,
      watchDirs: [],
      artifactIds: [],
      conditionCount: 0,
      tokenCategoryCount: 0,
      utilityCount: 0,
    }),
    async execute({ driver, cwd }) {
      const diagnostics = normalizeDiagnostics(driver.compiler.diagnostics(), { cwd })

      return {
        data: inspectDriver(driver),
        diagnostics,
        ok: diagnosticsPass(diagnostics, flags.maxWarnings),
      }
    },
    renderHuman(ctx, result) {
      if (result.ok) {
        ctx.output.log(
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
      }

      renderCommandDiagnostics(result.diagnostics, ctx.output, flags, ctx.cwd)
    },
  }) as Promise<InspectResult>
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
