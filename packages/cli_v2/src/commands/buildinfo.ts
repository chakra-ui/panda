import { createNodeDriver, type BuildInfo, type Diagnostic, type Driver } from '@pandacss/compiler'
import { defineCommand } from 'citty'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, relative } from 'node:path'
import {
  collectParseDiagnostics,
  configLoadDiagnostic,
  diagnosticsPass,
  missingConfigDiagnostic,
  normalizeDiagnostics,
} from '../diagnostics'
import {
  consoleOutput,
  createCommandOutput,
  renderCommandDiagnostics,
  resolveCwd,
  shouldPrintHumanSummary,
  shouldPrintJson,
  type OutputSink,
} from '../output'
import { createResult, setExitCode, toJsonPayload } from '../result'
import { renderTimings, time, timeAsync } from '../timing'
import { startCommandTracing } from '../tracing'
import type { BuildinfoFlags, BuildinfoResult, CommandContext, PhaseTimings } from '../types'

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
  const startedAt = performance.now()
  const cwd = resolveCwd(flags.cwd)
  const commandOutput = createCommandOutput(output, flags, cwd)
  const timings: PhaseTimings = {}
  const stopTracing = startCommandTracing(flags, cwd, commandOutput)

  const fail = (diagnostics: Diagnostic[]): BuildinfoResult => {
    const result = createResult({
      command: 'buildinfo',
      startedAt,
      data: { timings, outfile: undefined, moduleCount: 0, atomCount: 0, recipeCount: 0, bytes: 0 },
      diagnostics,
      ok: false,
    }) as BuildinfoResult

    if (shouldPrintJson(flags)) {
      output.log(JSON.stringify(toJsonPayload(result), null, 2))
    } else {
      renderCommandDiagnostics(result.diagnostics, commandOutput, flags, cwd)
      renderTimings('buildinfo', timings, commandOutput, flags)
    }

    stopTracing()
    return result
  }

  const missingConfig = missingConfigDiagnostic(flags.config, cwd)
  if (missingConfig) return fail([missingConfig])

  // --- Load config + parse library sources ---
  let driver: Driver
  try {
    driver = await timeAsync(timings, 'config', () => createNodeDriver({ cwd, configPath: flags.config }))
  } catch (error) {
    return fail([configLoadDiagnostic(error, { cwd, file: flags.config })])
  }

  const parsed = time(timings, 'parse', () => driver.parseFiles())
  const parseDiagnostics = collectParseDiagnostics(parsed, cwd)

  // --- Serialize encoder state (engine-owned fingerprint + portable module keys) ---
  const buildInfo = time(timings, 'buildinfo', () => {
    // `configFingerprint` is the engine's own config fingerprint — the producer only
    // supplies the published peer range.
    const info = driver.compiler.buildInfo.create({ panda: flags.panda ?? '*' })

    // Keys default to the engine's scan paths (absolute on disk). Rewrite them to
    // be relative to `cwd` so the published artifact is portable.
    return portableModules(info, cwd)
  })

  const outfile = flags.outfile ? driver.resolvePath(flags.outfile) : defaultOutfile(driver)
  const serialized = JSON.stringify(buildInfo, null, flags.minify ? 0 : 2)

  time(timings, 'write', () => {
    mkdirSync(dirname(outfile), { recursive: true })
    writeFileSync(outfile, serialized)
  })

  const diagnostics = normalizeDiagnostics([...parseDiagnostics, ...driver.compiler.diagnostics()], { cwd })
  const ok = diagnosticsPass(diagnostics, flags.maxWarnings)
  const moduleCount = Object.keys(buildInfo.modules).length
  const recipeGroups = buildInfo.recipes
  const recipeCount = (recipeGroups?.base?.length ?? 0) + (recipeGroups?.variants?.length ?? 0)

  const result = createResult({
    command: 'buildinfo',
    startedAt,
    data: {
      driver,
      timings,
      outfile,
      buildInfo,
      moduleCount,
      atomCount: buildInfo.atoms.length,
      recipeCount,
      bytes: Buffer.byteLength(serialized),
    },
    diagnostics,
    ok,
  }) as BuildinfoResult

  if (shouldPrintJson(flags)) {
    output.log(JSON.stringify(toJsonPayload(result), null, 2))
  } else {
    renderCommandDiagnostics(diagnostics, commandOutput, flags, cwd)
    if (shouldPrintHumanSummary(flags)) {
      commandOutput.log(
        `buildinfo: ${parsed.length} files → ${moduleCount} modules, ${buildInfo.atoms.length} atoms, ` +
          `${recipeCount} recipe groups (${result.bytes} bytes) → ${outfile}`,
      )
    }
    renderTimings('buildinfo', timings, commandOutput, flags)
  }

  stopTracing()
  return result
}

function defaultOutfile(driver: Driver): string {
  return driver.compiler.joinPath([driver.paths().root, 'panda.buildinfo.json'])
}

/** Rewrite module keys (engine scan paths) to `cwd`-relative POSIX paths so the
 *  artifact is portable across machines — both the `modules` keys and the
 *  `exports` values, which reference the same module ids. */
function portableModules(info: BuildInfo, cwd: string): BuildInfo {
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
