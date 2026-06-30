import { type Driver } from '@pandacss/compiler'
import { toRelativeKey } from '@pandacss/config'
import { diagnosticsPass } from '@pandacss/compiler-shared'
import { defineCommand } from 'citty'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { baseArgs, includeArgs, outputArgs, parseCliFlags, traceArgs } from '../args'
import { runCommand } from '../run-command'
import { collectCliParseDiagnostics, normalizeCliDiagnostics } from '../diagnostics'
import { buildinfoFlagsSchema } from '../schema'
import { consoleOutput, renderCommandDiagnostics, shouldPrintHumanSummary, type OutputSink } from '../output'
import { setExitCode } from '../result'
import { time } from '../timing'
import type { BuildinfoFlags, BuildinfoResult } from '../schema'

export const buildinfoCommand = defineCommand({
  meta: {
    name: 'buildinfo',
    description: 'Build a portable panda.buildinfo.json for a design-system library',
  },
  args: () => ({
    ...baseArgs(),
    ...includeArgs(),
    outfile: { type: 'string', description: "Output path, default './<outdir>/panda.buildinfo.json'", alias: 'o' },
    panda: { type: 'string', description: "Peer Panda version range to stamp into the artifact (default '*')" },
    minify: { type: 'boolean', description: 'Minify the generated JSON', alias: 'm' },
    ...outputArgs(),
    ...traceArgs(),
  }),
  run: async ({ args }) => setExitCode(await runBuildinfo(parseCliFlags(buildinfoFlagsSchema, args))),
})

export async function runBuildinfo(
  flags: BuildinfoFlags = {},
  output: OutputSink = consoleOutput,
): Promise<BuildinfoResult> {
  let parsedFileCount = 0

  return runCommand({
    command: 'buildinfo',
    flags,
    output,
    failData: () => ({
      outfile: undefined,
      moduleCount: 0,
      atomCount: 0,
      recipeCount: 0,
      bytes: 0,
    }),
    async execute({ driver, cwd, timings }) {
      const parsed = time({ timings, phase: 'parse', run: () => driver.parseFiles() })
      parsedFileCount = parsed.length
      const parseDiagnostics = collectCliParseDiagnostics(parsed, cwd)

      const buildInfo = time({
        timings,
        phase: 'buildinfo',
        run: () => {
          const info = driver.compiler.buildInfo.create({ panda: flags.panda ?? '*' })
          return driver.compiler.buildInfo.normalize(info, { mapModuleKey: (key) => toRelativeKey(key, cwd) })
        },
      })

      const outfile = flags.outfile ? driver.resolvePath(flags.outfile) : defaultOutfile(driver)
      const serialized = JSON.stringify(buildInfo, null, flags.minify ? 0 : 2)

      time({
        timings,
        phase: 'write',
        run: () => {
          mkdirSync(dirname(outfile), { recursive: true })
          writeFileSync(outfile, serialized)
        },
      })

      const diagnostics = normalizeCliDiagnostics([...parseDiagnostics, ...driver.compiler.diagnostics()], { cwd })
      const moduleCount = Object.keys(buildInfo.modules).length
      const recipeGroups = buildInfo.recipes
      const recipeCount = (recipeGroups?.base?.length ?? 0) + (recipeGroups?.variants?.length ?? 0)

      return {
        data: {
          outfile,
          buildInfo,
          moduleCount,
          atomCount: buildInfo.atoms.length,
          recipeCount,
          bytes: Buffer.byteLength(serialized),
        },
        diagnostics,
        ok: diagnosticsPass(diagnostics, { maxWarnings: flags.maxWarnings }),
      }
    },
    renderHuman(ctx, result) {
      renderCommandDiagnostics(result.diagnostics, ctx.output, flags, ctx.cwd)

      if (result.ok && shouldPrintHumanSummary(flags)) {
        ctx.output.log(
          `buildinfo: ${parsedFileCount} files → ${result.moduleCount} modules, ${result.atomCount} atoms, ` +
            `${result.recipeCount} recipe groups (${result.bytes} bytes) → ${result.outfile}`,
        )
      }
    },
  }) as Promise<BuildinfoResult>
}

function defaultOutfile(driver: Driver): string {
  return driver.compiler.path.join([driver.paths().root, 'panda.buildinfo.json'])
}
