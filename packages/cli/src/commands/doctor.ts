import { defineCommand } from 'citty'
import { countErrors, diagnosticsPass } from '@pandacss/compiler-shared'
import { parseCliFlags, runtimeArgs } from '../args'
import { runCommand } from '../run-command'
import { normalizeCliDiagnostics } from '../diagnostics'
import { doctorFlagsSchema } from '../schema'
import { consoleOutput, renderCommandDiagnostics, shouldPrintHumanSummary, type OutputSink } from '../output'
import { projectSummary } from '../project-summary'
import { setExitCode } from '../result'
import type { DoctorFlags, DoctorResult } from '../schema'

export const doctorCommand = defineCommand({
  meta: {
    name: 'doctor',
    description: 'Validate Panda setup and print a project summary',
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
      sourceCount: 0,
      watchDirs: [],
      artifactIds: [],
      conditionCount: 0,
      tokenCategoryCount: 0,
      utilityCount: 0,
    }),
    async execute({ driver, cwd }) {
      const diagnostics = normalizeCliDiagnostics(driver.compiler.diagnostics(), { cwd })
      const errors = countErrors(diagnostics)
      const summary = projectSummary(driver)

      return {
        data: {
          ...summary,
          diagnosticCount: diagnostics.length,
          errors,
        },
        diagnostics,
        ok: diagnosticsPass(diagnostics, { maxWarnings: flags.maxWarnings }),
      }
    },
    renderHuman(ctx, result) {
      if (result.diagnostics.length > 0) {
        renderCommandDiagnostics(result.diagnostics, ctx.output, flags, ctx.cwd)
      }

      if (result.ok && shouldPrintHumanSummary(flags)) {
        ctx.output.log(
          [
            result.errors > 0
              ? `doctor: ${result.errors} errors`
              : `doctor: ok (${result.diagnosticCount} diagnostics)`,
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
    },
  }) as Promise<DoctorResult>
}
