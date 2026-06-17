import { type Driver } from '@pandacss/compiler'
import { defineCommand } from 'citty'
import { parseCliFlags, runtimeArgs } from '../args'
import { runCommand } from '../run-command'
import { infoFlagsSchema } from '../schema'
import { diagnosticsPass, normalizeDiagnostics } from '../diagnostics'
import { consoleOutput, renderCommandDiagnostics, type OutputSink } from '../output'
import { setExitCode } from '../result'
import type { InfoFlags, InfoResult, InfoSummary } from '../schema'

export const infoCommand = defineCommand({
  meta: {
    name: 'info',
    description: 'Show project and compiler info',
  },
  args: runtimeArgs,
  run: async ({ args }) => setExitCode(await runInfo(parseCliFlags(infoFlagsSchema, args))),
})

export async function runInfo(flags: InfoFlags = {}, output: OutputSink = consoleOutput): Promise<InfoResult> {
  return runCommand({
    command: 'info',
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
        data: infoDriver(driver),
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
  }) as Promise<InfoResult>
}

export function infoDriver(driver: Driver): InfoSummary {
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
