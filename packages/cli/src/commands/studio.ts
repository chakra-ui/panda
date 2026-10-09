import { defineCommand } from 'citty'
import { encodeSpec } from '@pandacss/compiler-shared'
import { parseCliFlags, runtimeArgs } from '../args'
import { runCommand } from '../run-command'
import {
  consoleOutput,
  renderCommandDiagnostics,
  shouldPrintHumanSummary,
  shouldPrintJson,
  type OutputSink,
} from '../output'
import { setExitCode } from '../result'
import { openUrl } from '../open-url'
import { studioFlagsSchema, type StudioFlags, type StudioResult } from '../schema'
import { serveStudio, type StudioWatchServer } from '../studio-watch'
import { formatWatchError, startProjectWatch } from '../watch'
import { createWatchLogger } from '../watch-logger'
import { parseMilliseconds } from '../timing'

const STUDIO_URL = 'https://studio.panda-css.com'
const MAX_URL_LENGTH = 80_000

export const studioCommand = defineCommand({
  meta: {
    name: 'studio',
    description: 'Open your design system in Panda Studio',
  },
  args: () => ({
    ...runtimeArgs(),
    open: {
      type: 'boolean',
      default: true,
      description: 'Open the studio in your browser',
      negativeDescription: 'Print the link without opening a browser',
    },
    watch: { type: 'boolean', description: 'Keep Studio in sync with your config', alias: 'w' },
    'watch-debounce': { type: 'string', description: 'Watch rebuild debounce in milliseconds' },
  }),
  run: async ({ args, rawArgs }) => setExitCode(await runStudio(parseCliFlags(studioFlagsSchema, args, rawArgs))),
})

export async function runStudio(
  flags: StudioFlags = {},
  output: OutputSink = consoleOutput,
  open: (url: string) => void = openUrl,
): Promise<StudioResult> {
  const studioUrl = process.env.PANDA_STUDIO_URL ?? STUDIO_URL
  let server: StudioWatchServer | undefined
  let cwd = ''

  const result = (await runCommand<StudioFlags, Pick<StudioResult, 'url' | 'files' | 'error'>>({
    command: 'studio',
    flags,
    output,
    trackSources: true,
    failData: () => ({ files: [] }),
    async execute(ctx) {
      const { driver } = ctx
      cwd = ctx.cwd
      const json = driver.specJson()
      if (!json) {
        return {
          data: { files: [], error: 'nothing to show, your config has no tokens (add a preset or theme tokens)' },
          ok: false,
        }
      }

      if (flags.watch) {
        server = await serveStudio(studioUrl, json)
        if (flags.open !== false && !shouldPrintJson(flags)) open(server.url)
        return { data: { url: server.url, files: [] } }
      }

      const url = `${new URL('/view', studioUrl)}#spec=${await encodeSpec(json)}`
      if (url.length > MAX_URL_LENGTH) {
        return {
          data: {
            files: driver.spec(),
            error: `your design system is too large for a link (${url.length} characters)`,
          },
          ok: false,
        }
      }

      if (flags.open !== false && !shouldPrintJson(flags)) open(url)
      return { data: { url, files: [] } }
    },
    renderHuman(ctx, result) {
      if (result.diagnostics.length > 0) renderCommandDiagnostics(result.diagnostics, ctx.output, flags, ctx.cwd)
      if (!shouldPrintHumanSummary(flags)) return
      if (result.url) {
        const opened = flags.open !== false && !flags.watch
        ctx.output.log(opened ? `studio: opened ${studioUrl} in your browser` : `studio: ${result.url}`)
        if (flags.watch) ctx.output.log('studio: watching your config, press Ctrl+C to stop')
        return
      }
      if (!result.error) return
      const lines = [`studio: ${result.error}`]
      if (result.files.length) lines.push(`wrote ${result.files[0]}`, `drop it on ${studioUrl} to view it`)
      ctx.output.log(lines.join('\n'))
    },
  })) as StudioResult

  if (server && result.driver) {
    const driver = result.driver
    const watchLogger = createWatchLogger(output)
    const stopWatch = await startProjectWatch({
      driver,
      cwd,
      outdir: () => driver.getOutdir(),
      debounceMs: parseMilliseconds(flags.watchDebounce),
      onStatus: (message) => watchLogger.log(message),
      onError: (error) => watchLogger.error(`panda: failed to process watch batch\n${formatWatchError(error)}`),
      onSourceChange: () => undefined,
      onConfigChange: async () => {
        const diff = await driver.reload()
        const json = driver.specJson()
        if (!diff.hasChanged || !json) return
        server!.update(json)
        output.log('studio: updated')
      },
    })

    const stopTracing = result.stop
    result.stop = async () => {
      await stopWatch()
      await server!.close()
      await stopTracing?.()
    }
  }

  return result
}
