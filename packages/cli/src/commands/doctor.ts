import { defineCommand } from 'citty'
import { parseCliFlags, runtimeArgs } from '../args'
import { runCommand } from '../run-command'
import { doctorFlagsSchema } from '../schema'
import { countErrors, diagnosticsPass, normalizeDiagnostics } from '../diagnostics'
import { consoleOutput, renderCommandDiagnostics, shouldPrintHumanSummary, type OutputSink } from '../output'
import { setExitCode } from '../result'
import type { DoctorFlags, DoctorResult } from '../schema'

export const doctorCommand = defineCommand({
  meta: {
    name: 'doctor',
    description: 'Validate Panda setup and diagnostics',
  },
  args: runtimeArgs,
  run: async ({ args }) => setExitCode(await runDoctor(parseCliFlags(doctorFlagsSchema, args))),
})

export async function runDoctor(flags: DoctorFlags = {}, output: OutputSink = consoleOutput): Promise<DoctorResult> {
  return runCommand({
    command: 'doctor',
    flags,
    output,
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
          result.errors > 0 ? `doctor: ${result.errors} errors` : `doctor: ok (${result.diagnosticCount} diagnostics)`,
        )
      }
    },
  }) as Promise<DoctorResult>
}
