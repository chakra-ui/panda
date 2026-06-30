import {
  compilePreset,
  defaultImportMap,
  readPackageIdentity,
  syncExports,
  type CompilePresetResult,
} from '@pandacss/config'
import { type Diagnostic, type Driver } from '@pandacss/compiler'
import { defineCommand } from 'citty'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, join, relative } from 'node:path'
import { baseArgs, includeArgs, normalizeInclude, outputArgs, parseCliFlags, traceArgs } from '../args'
import { collectParseDiagnostics, diagnosticsPass, normalizeDiagnostics } from '../diagnostics'
import { consoleOutput, renderCommandDiagnostics, shouldPrintHumanSummary, type OutputSink } from '../output'
import { setExitCode } from '../result'
import { runCommand } from '../run-command'
import { libFlagsSchema } from '../schema'
import { parseMilliseconds, time } from '../timing'
import { formatWatchError, startProjectWatch } from '../watch'
import { createWatchLogger } from '../watch-logger'
import type { LibFlags, LibResult, PhaseTimings } from '../schema'

const DEFAULT_OUTDIR = 'dist'
const DEFAULT_FILES = ['./**/*.{js,mjs}']

export const libCommand = defineCommand({
  meta: {
    name: 'lib',
    description:
      'Publish a design system: write panda.lib.json, portable build info, and a compiled preset, and sync package.json exports',
  },
  args: () => ({
    ...baseArgs(),
    ...includeArgs(),
    outdir: {
      type: 'string',
      description: `Output directory for the artifacts (default '${DEFAULT_OUTDIR}')`,
      alias: 'o',
    },
    panda: {
      type: 'string',
      description: "Peer Panda version range to stamp (defaults to the package's @pandacss/dev peer, or '*')",
    },
    files: {
      type: 'string',
      description:
        'Re-extract fallback globs for consumers, relative to the output dir (comma-separated, or repeat the flag)',
    },
    minify: { type: 'boolean', description: 'Minify the generated build info JSON', alias: 'm' },
    ...outputArgs(),
    ...traceArgs(),
  }),
  run: async ({ args }) => setExitCode(await runLib(parseCliFlags(libFlagsSchema, args))),
})

export async function runLib(flags: LibFlags = {}, output: OutputSink = consoleOutput): Promise<LibResult> {
  let parsedFileCount = 0
  let runCwd = flags.cwd ?? process.cwd()
  let preset: CompilePresetResult | undefined

  const result = (await runCommand({
    command: 'lib',
    flags,
    output,
    keepTracing: !!flags.watch,
    failData: () => ({ exportsChanged: false }),
    async execute({ driver, cwd, timings }) {
      runCwd = cwd
      const generated = await generateLib(driver, cwd, flags, timings)
      preset = generated.preset
      parsedFileCount = generated.parsedFileCount
      return {
        data: {
          manifestPath: generated.manifestPath,
          buildInfoPath: generated.buildInfoPath,
          presetPath: generated.presetPath,
          exportsChanged: generated.exportsChanged,
        },
        diagnostics: generated.diagnostics,
        ok: diagnosticsPass(generated.diagnostics, flags.maxWarnings),
      }
    },
    renderHuman(ctx, result) {
      renderCommandDiagnostics(result.diagnostics, ctx.output, flags, ctx.cwd)
      if (result.ok && shouldPrintHumanSummary(flags)) {
        ctx.output.log(
          `lib: ${parsedFileCount} files → ${result.manifestPath}` +
            (result.exportsChanged ? ' (package.json exports updated)' : ''),
        )
      }
    },
  })) as LibResult

  if (flags.watch && result.driver) {
    const driver = result.driver
    const watchLogger = createWatchLogger(output)
    const regenerate = async () => {
      const generated = await generateLib(driver, runCwd, flags, {}, preset)
      preset = generated.preset
      Object.assign(result, {
        manifestPath: generated.manifestPath,
        buildInfoPath: generated.buildInfoPath,
        presetPath: generated.presetPath,
        exportsChanged: generated.exportsChanged,
        diagnostics: generated.diagnostics,
      })
    }

    const stopWatch = await startProjectWatch({
      driver,
      cwd: runCwd,
      outdir: () => driver.resolvePath(flags.outdir ?? DEFAULT_OUTDIR),
      debounceMs: parseMilliseconds(flags.watchDebounce),
      onStatus: (message) => watchLogger.log(message),
      onError: (error) => watchLogger.error(`panda: failed to rebuild design system\n${formatWatchError(error)}`),
      onSourceChange: async (events) => {
        driver.applyChanges(events)
        await regenerate()
      },
      onConfigChange: async () => {
        const diff = await driver.reload()
        if (diff.hasChanged) {
          preset = undefined
          await regenerate()
        }
      },
    })

    const stopTracing = result.stop
    result.stop = async () => {
      await stopWatch()
      await stopTracing?.()
    }
  }

  return result
}

interface GeneratedLib {
  manifestPath: string
  buildInfoPath: string
  presetPath: string
  exportsChanged: boolean
  parsedFileCount: number
  diagnostics: Diagnostic[]
  preset?: CompilePresetResult
}

export async function generateLib(
  driver: Driver,
  cwd: string,
  flags: LibFlags,
  timings: PhaseTimings,
  cachedPreset?: CompilePresetResult,
): Promise<GeneratedLib> {
  if (!driver.configPath) {
    throw new Error(
      'panda lib requires a resolved config file to compile the design system preset. Run `panda init`, or check --config/--cwd.',
    )
  }

  const parsed = time({ timings, phase: 'parse', run: () => driver.parseFiles() })
  const parseDiagnostics = collectParseDiagnostics(parsed, cwd)
  const diagnostics = normalizeDiagnostics([...parseDiagnostics, ...driver.compiler.diagnostics()], { cwd })

  if (!diagnosticsPass(diagnostics, flags.maxWarnings)) {
    return {
      manifestPath: '',
      buildInfoPath: '',
      presetPath: '',
      exportsChanged: false,
      parsedFileCount: parsed.length,
      diagnostics,
    }
  }

  const identity = readPackageIdentity(cwd)
  const pandaRange = flags.panda ?? identity.pandaPeer ?? '*'

  const outRoot = driver.resolvePath(flags.outdir ?? DEFAULT_OUTDIR)
  const manifestPath = join(outRoot, 'panda.lib.json')
  const buildInfoPath = join(outRoot, 'panda.buildinfo.json')
  const presetPath = join(outRoot, 'preset.mjs')

  const buildInfo = time({
    timings,
    phase: 'buildinfo',
    run: () => {
      const info = driver.compiler.buildInfo.create({ panda: pandaRange })
      return driver.compiler.buildInfo.normalize(info, { mapModuleKey: (key) => toRelativeKey(key, cwd) })
    },
  })

  const preset = cachedPreset ?? (await compilePreset({ configPath: driver.configPath, cwd }))

  const manifest = driver.compiler.designSystem.create({
    name: identity.name,
    version: identity.version,
    panda: pandaRange,
    preset: './preset.mjs',
    buildInfo: './panda.buildinfo.json',
    importMap: defaultImportMap(identity.name),
    designSystem: typeof driver.config.designSystem === 'string' ? driver.config.designSystem : undefined,
    files: normalizeInclude(flags.files) ?? DEFAULT_FILES,
  })

  time({
    timings,
    phase: 'write',
    run: () => {
      mkdirSync(outRoot, { recursive: true })
      writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
      writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, flags.minify ? 0 : 2))
      writeFileSync(presetPath, preset.code)
    },
  })

  const exportsChanged = syncPackageExports(identity.packagePath, { manifestPath, presetPath })

  return {
    manifestPath,
    buildInfoPath,
    presetPath,
    exportsChanged,
    parsedFileCount: parsed.length,
    diagnostics,
    preset,
  }
}

function syncPackageExports(packagePath: string, paths: { manifestPath: string; presetPath: string }): boolean {
  const base = dirname(packagePath)
  const entries = {
    './panda.lib.json': toPosixRelative(base, paths.manifestPath),
    './preset': toPosixRelative(base, paths.presetPath),
  }
  const result = syncExports({ packageJson: readFileSync(packagePath, 'utf8'), entries })
  if (result.changed) writeFileSync(packagePath, result.json)
  return result.changed
}

function toPosixRelative(from: string, to: string): string {
  const rel = relative(from, to).split('\\').join('/')
  return rel.startsWith('.') ? rel : `./${rel}`
}

function toRelativeKey(key: string, cwd: string): string {
  const rel = isAbsolute(key) ? relative(cwd, key) : key
  return rel.split('\\').join('/')
}
