import { defineCommand } from 'citty'
import { runCommand } from '../run-command'
import { countErrors, diagnosticsPass, normalizeDiagnostics } from '../diagnostics'
import { consoleOutput, renderCommandDiagnostics, shouldPrintHumanSummary, type OutputSink } from '../output'
import { setExitCode } from '../result'
import type { CommandContext, ValidateFlags, ValidateResult } from '../types'

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
  return runCommand({
    command: 'validate',
    flags,
    output,
    respectSilent: true,
    failData: (diagnostics) => ({
      diagnosticCount: diagnostics.length,
      errors: diagnostics.length,
    }),
    async execute({ driver, cwd }) {
      const diagnostics = normalizeDiagnostics(driver.compiler.diagnostics(), { cwd })
      const errors = countErrors(diagnostics)

      return {
        data: {
          configPath: driver.configPath,
          diagnosticCount: diagnostics.length,
          errors,
        },
        diagnostics,
        ok: diagnosticsPass(diagnostics, flags.maxWarnings),
      }
    },
    renderHuman(ctx, result) {
      if (result.diagnostics.length > 0) {
        renderCommandDiagnostics(result.diagnostics, ctx.output, flags, ctx.cwd)
      }

      if (result.ok && shouldPrintHumanSummary(flags)) {
        ctx.output.log(
          result.errors > 0
            ? `validate: ${result.errors} errors`
            : `validate: ok (${result.diagnosticCount} diagnostics)`,
        )
      }
    },
  }) as Promise<ValidateResult>
}
