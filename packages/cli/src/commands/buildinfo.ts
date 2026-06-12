import { type BuildInfo, type Driver } from '@pandacss/compiler'
import { defineCommand } from 'citty'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, relative } from 'node:path'
import { runCommand } from '../run-command'
import { collectParseDiagnostics, diagnosticsPass, normalizeDiagnostics } from '../diagnostics'
import { consoleOutput, renderCommandDiagnostics, shouldPrintHumanSummary, type OutputSink } from '../output'
import { setExitCode } from '../result'
import { time } from '../timing'
import type { BuildinfoFlags, BuildinfoResult, CommandContext } from '../types'

export function buildinfoCommand(ctx: CommandContext) {
  return defineCommand({
    meta: {
      name: 'buildinfo',
      description: 'Build a portable panda.buildinfo.json for a design-system library',
    },
    args: {
      cwd: { type: 'string', description: 'Current working directory', default: ctx.cwd },
      config: { type: 'string', description: 'Path to panda config file', alias: 'c' },
      outfile: { type: 'string', description: "Output path, default './<outdir>/panda.buildinfo.json'", alias: 'o' },
      panda: { type: 'string', description: "Peer Panda version range to stamp into the artifact (default '*')" },
      minify: { type: 'boolean', description: 'Minify the generated JSON', alias: 'm' },
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
    },
    run: async ({ args }) => setExitCode(await runBuildinfo(args as BuildinfoFlags)),
  })
}

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
      const parseDiagnostics = collectParseDiagnostics(parsed, cwd)

      const buildInfo = time({
        timings,
        phase: 'buildinfo',
        run: () => {
          const info = driver.compiler.buildInfo.create({ panda: flags.panda ?? '*' })
          return normalizeBuildInfo(info, cwd)
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

      const diagnostics = normalizeDiagnostics([...parseDiagnostics, ...driver.compiler.diagnostics()], { cwd })
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
        ok: diagnosticsPass(diagnostics, flags.maxWarnings),
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
  return driver.compiler.joinPath([driver.paths().root, 'panda.buildinfo.json'])
}

/** Rewrite module keys (engine scan paths) to `cwd`-relative POSIX paths so the
 *  artifact is portable across machines — both the `modules` keys and the
 *  `exports` values, which reference the same module ids. */
function normalizeBuildInfo(info: BuildInfo, cwd: string): BuildInfo {
  const modules: BuildInfo['modules'] = {}

  for (const [key, entry] of Object.entries(info.modules)) {
    modules[toRelativeKey(key, cwd)] = entry
  }

  if (!info.exports) return { ...info, modules }

  const exports: Record<string, string> = {}

  for (const [name, key] of Object.entries(info.exports)) {
    exports[name] = toRelativeKey(key, cwd)
  }

  return { ...info, modules, exports }
}

function toRelativeKey(key: string, cwd: string): string {
  const rel = isAbsolute(key) ? relative(cwd, key) : key
  return rel.split('\\').join('/')
}
