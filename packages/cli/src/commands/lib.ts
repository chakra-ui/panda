import { defineCommand } from 'citty'
import { baseArgs, includeArgs, normalizeInclude, outputArgs, parseCliFlags, traceArgs } from '../args'
import { consoleOutput, renderCommandDiagnostics, shouldPrintHumanSummary, type OutputSink } from '../output'
import { setExitCode } from '../result'
import { runCommand } from '../run-command'
import { libFlagsSchema } from '../schema'
import { parseMilliseconds, timeAsync } from '../timing'
import { formatWatchError, startProjectWatch } from '../watch'
import { createWatchLogger } from '../watch-logger'
import type { LibFlags, LibResult } from '../schema'

const DEFAULT_OUTDIR = 'dist'

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

  const result = (await runCommand({
    command: 'lib',
    flags,
    output,
    keepTracing: !!flags.watch,
    failData: () => ({ exportsChanged: false }),
    async execute({ driver, cwd, timings }) {
      runCwd = cwd

      const generated = await timeAsync({
        timings,
        phase: 'lib',
        run: () =>
          driver.writeDesignSystemLib({
            outdir: flags.outdir,
            files: normalizeInclude(flags.files),
            panda: flags.panda,
            minify: flags.minify,
            maxWarnings: flags.maxWarnings,
          }),
      })
      parsedFileCount = generated.parsedFileCount

      return {
        data: {
          manifestPath: generated.manifestPath,
          buildInfoPath: generated.buildInfoPath,
          presetPath: generated.presetPath,
          exportsChanged: generated.exportsChanged,
        },
        diagnostics: generated.diagnostics,
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
      const generated = await driver.writeDesignSystemLib({
        outdir: flags.outdir,
        files: normalizeInclude(flags.files),
        panda: flags.panda,
        minify: flags.minify,
        maxWarnings: flags.maxWarnings,
      })

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
