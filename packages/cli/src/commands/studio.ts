import { randomBytes } from 'node:crypto'
import { relative } from 'node:path'
import { defineCommand } from 'citty'
import type { Diagnostic } from '@pandacss/compiler'
import { baseArgs, includeArgs, normalizeInclude, parseCliFlags } from '../args'
import { normalizeCliDiagnostics } from '../diagnostics'
import { consoleOutput, renderCommandDiagnostics, resolveCwd, type OutputSink } from '../output'
import { ExitCode, setExitCode } from '../result'
import { runCommand } from '../run-command'
import type { StudioFlags, StudioResult } from '../schema'
import { studioFlagsSchema } from '../schema'
import { openBrowser } from '../open-browser'
import { createStudioProject, type StudioProject } from '../studio-project'
import { startStudioServer, type StudioServer } from '../studio-server'
import { formatWatchError, startProjectWatch, type WatchEvent } from '../watch'
import { createWatchLogger } from '../watch-logger'

export const DEFAULT_STUDIO_URL = 'https://studio.panda-css.com'
export const DEFAULT_STUDIO_PORT = 6420
const PORT_ATTEMPTS = 11

export const studioCommand = defineCommand({
  meta: {
    name: 'studio',
    description: 'Open Panda Studio in your browser, live-connected to this project',
  },
  args: () => ({
    ...baseArgs(),
    ...includeArgs(),
    port: {
      type: 'string',
      valueHint: 'number',
      description: `Port for the local server (default ${DEFAULT_STUDIO_PORT})`,
    },
    open: {
      type: 'boolean',
      description: 'Open Studio in your browser',
      negativeDescription: "Don't open a browser",
      default: true,
    },
    'watch-debounce': { type: 'string', valueHint: 'ms', description: 'Watch rebuild debounce in milliseconds' },
    'studio-url': {
      type: 'string',
      valueHint: 'url',
      description: 'Studio to open, for Studio development (https, or http://localhost:<port>)',
    },
    'log-level': {
      type: 'string',
      valueHint: 'level',
      description: 'Set output level: silent, error, warn, info, or debug',
    },
    logfile: { type: 'string', valueHint: 'file', description: 'Write human output to a log file' },
    color: {
      type: 'boolean',
      description: 'Enable ANSI colors in human output',
      negativeDescription: 'Disable ANSI colors in human output',
      default: true,
    },
  }),
  async run({ args, rawArgs }) {
    if (rawArgs.includes('--json')) {
      return usageError(
        "studio: --json isn't supported because studio is a long-running server.\nFor a machine-readable usage report, run: panda analyze --json",
      )
    }
    const flags = parseCliFlags(studioFlagsSchema, args, rawArgs)
    const studioUrl = resolveStudioUrl(flags.studioUrl ?? process.env.PANDA_STUDIO_URL)
    if (!studioUrl.ok) return usageError(studioUrl.error)
    const port = parsePort(flags.port)
    if (port === undefined)
      return usageError(`studio: --port must be a whole number from 0 to 65535 (got "${flags.port}")`)

    const explicitOpen = rawArgs.includes('--open')
    const open = explicitOpen || (flags.open !== false && !process.env.CI && !!process.stdout.isTTY)
    setExitCode(await runStudio({ ...flags, open }, consoleOutput, { studioUrl: studioUrl.url, port }))
  },
})

export interface StudioRunOptions {
  /** Studio page the bridge frames. */
  studioUrl?: string
  port?: number
  token?: string
  openBrowser?: (url: string) => Promise<boolean>
}

export async function runStudio(
  flags: StudioFlags = {},
  output: OutputSink = consoleOutput,
  options: StudioRunOptions = {},
): Promise<StudioResult> {
  const explicitPort = flags.port !== undefined
  const preferredPort = options.port ?? DEFAULT_STUDIO_PORT
  const studioUrl = options.studioUrl ?? resolveStudioPage(DEFAULT_STUDIO_URL)
  const token = options.token ?? randomBytes(12).toString('base64url')
  const include = normalizeInclude(flags.include)

  let server: StudioServer | undefined
  let project: StudioProject | undefined
  let movedFrom: number | undefined

  const result = (await runCommand<StudioFlags, { url?: string; port?: number }>({
    command: 'studio',
    flags,
    output,
    failData: () => ({}),
    async execute(ctx) {
      project = createStudioProject(ctx.driver, { cwd: ctx.cwd, include })
      const diagnostics = normalizeCliDiagnostics(project.diagnostics, { cwd: ctx.cwd })
      const snapshot = () => project!.snapshot()
      const rejected = createWatchLogger(ctx.output)

      const listen = (port: number) =>
        startStudioServer({
          port,
          token,
          studioUrl,
          snapshot,
          onConnect: () => ctx.output.log('studio: Studio connected'),
          onReject: () =>
            rejected.log('studio: rejected a connection with an invalid token (a tab left over from an earlier run?)'),
        })

      const attempts = explicitPort || preferredPort === 0 ? 1 : PORT_ATTEMPTS
      for (let attempt = 0; attempt < attempts; attempt++) {
        try {
          server = await listen(preferredPort + attempt)
          if (attempt > 0) movedFrom = preferredPort
          break
        } catch (error) {
          if (!isAddressInUse(error)) throw error
        }
      }

      if (!server) {
        return { data: {}, diagnostics: [...diagnostics, portInUseDiagnostic(preferredPort, explicitPort)], ok: false }
      }

      // Diagnostics from the first analysis don't stop the server; Studio is for looking at broken projects too.
      return { data: { url: server.url, port: server.port }, diagnostics, ok: true }
    },
    renderHuman(ctx, commandResult) {
      renderCommandDiagnostics(commandResult.diagnostics, ctx.output, flags, ctx.cwd)
      if (!server || !ctx.driver) return
      const sourceCount = ctx.driver.scan({ include }).length
      const config = ctx.driver.configPath ? relative(ctx.cwd, ctx.driver.configPath) : undefined
      ctx.output.log(
        `studio: watching ${sourceCount} source ${sourceCount === 1 ? 'file' : 'files'}${config ? `, config ${config}` : ''}`,
      )
      if (movedFrom !== undefined) ctx.output.log(`studio: port ${movedFrom} is in use, using ${server.port}`)
      ctx.output.log(`studio: ready at ${server.url}`)
    },
  })) as StudioResult

  if (!server || !project || !result.driver) return result

  const driver = result.driver
  const cwd = resolveCwd(flags.cwd)
  const watchLogger = createWatchLogger(output)
  const timed = async (run: () => void, describe: (ms: number) => string) => {
    const startedAt = performance.now()
    run()
    output.log(describe(Math.round(performance.now() - startedAt)))
  }

  const broadcastAll = (messages: ReturnType<StudioProject['update']>) => {
    for (const message of messages) server!.broadcast(message)
  }

  const stopWatch = await startProjectWatch({
    driver,
    cwd,
    outdir: () => driver.getOutdir(),
    debounceMs: parseMilliseconds(flags.watchDebounce),
    onStatus: (message) => {
      if (message === 'watch: stopped') output.log('studio: stopped')
      else if (message.includes('failed') || message.includes('dropped'))
        watchLogger.log(message.replace(/^watch:/, 'studio:'))
    },
    onError: (error) => watchLogger.error(`studio: couldn't process the change\n${formatWatchError(error)}`),
    onSourceChange: (events) =>
      timed(
        () => {
          driver.applyChanges(events)
          broadcastAll(project!.update())
          reportAnalysisErrors(project!.diagnostics, events, cwd, output, flags)
        },
        (ms) => `studio: updated ${describeChange(cwd, events)} (${ms}ms)`,
      ),
    onRescan: () =>
      timed(
        () => broadcastAll(project!.update()),
        (ms) => `studio: re-scanned the project (${ms}ms)`,
      ),
    onConfigChange: async () => {
      const startedAt = performance.now()
      const diff = await driver.reload()
      if (!diff.hasChanged) return
      broadcastAll(project!.reload())
      output.log(`studio: config changed, reloaded design system (${Math.round(performance.now() - startedAt)}ms)`)
    },
  })

  if (flags.open) {
    output.log('studio: opening Panda Studio in your browser. Press Ctrl+C to stop.')
    const opened = await (options.openBrowser ?? openBrowser)(server.url)
    if (!opened) {
      const message = `studio: couldn't open a browser. Open this URL to continue:\n  ${server.url}`
      if (output.error) output.error(message)
      else output.log(message)
    }
  } else {
    output.log('studio: open the URL above to start. Press Ctrl+C to stop.')
  }

  const stopTracing = result.stop
  const activeServer = server
  result.stop = async () => {
    await stopWatch()
    await activeServer.close()
    await stopTracing?.()
  }
  return result
}

export function resolveStudioUrl(value: string | undefined): { ok: true; url: string } | { ok: false; error: string } {
  if (!value) return { ok: true, url: resolveStudioPage(DEFAULT_STUDIO_URL) }
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return { ok: false, error: studioUrlError(value) }
  }
  const local = url.protocol === 'http:' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
  if (url.protocol !== 'https:' && !local) return { ok: false, error: studioUrlError(value) }
  return { ok: true, url: resolveStudioPage(url.href) }
}

/** A bare Studio origin opens the project scan; a URL with a path is used as given. */
function resolveStudioPage(base: string): string {
  const url = new URL(base)
  if (url.pathname === '/' && !url.search) {
    url.pathname = '/analyze'
    url.search = '?view=project'
  }
  return url.href
}

function studioUrlError(value: string): string {
  return `studio: --studio-url must be an https URL or http://localhost:<port> (got "${value}")`
}

function parsePort(value: StudioFlags['port']): number | undefined {
  if (value === undefined) return DEFAULT_STUDIO_PORT
  const port = Number(value)
  return Number.isInteger(port) && port >= 0 && port <= 65535 ? port : undefined
}

function parseMilliseconds(value: StudioFlags['watchDebounce']): number | undefined {
  if (value === undefined) return undefined
  const ms = Number(value)
  return Number.isFinite(ms) && ms >= 0 ? ms : undefined
}

function portInUseDiagnostic(port: number, explicit: boolean): Diagnostic {
  return {
    code: 'studio_port_in_use',
    severity: 'error',
    category: 'studio',
    message: explicit
      ? `studio: port ${port} is already in use\nAnother \`panda studio\` may be running. Stop it, or choose another port: panda studio --port ${port + 1}`
      : `studio: ports ${port}–${port + PORT_ATTEMPTS - 1} are all in use\nStop another \`panda studio\`, or choose a port: panda studio --port <number>`,
  }
}

function isAddressInUse(error: unknown): boolean {
  return (error as NodeJS.ErrnoException | undefined)?.code === 'EADDRINUSE'
}

// Editors and `sed -i` often report one save as several events for the same file.
function describeChange(cwd: string, events: WatchEvent[]): string {
  const paths = [...new Set(events.map((event) => event.path))]
  if (paths.length === 1) return relative(cwd, paths[0]!) || paths[0]!
  return `${paths.length} source files`
}

function reportAnalysisErrors(
  diagnostics: Diagnostic[],
  events: WatchEvent[],
  cwd: string,
  output: OutputSink,
  flags: StudioFlags,
): void {
  const changed = new Set(events.map((event) => event.path))
  const errors = diagnostics.filter((d) => d.severity === 'error' && d.file && changed.has(d.file))
  if (errors.length === 0) return
  renderCommandDiagnostics(normalizeCliDiagnostics(errors, { cwd }), output, flags, cwd)
}

function usageError(message: string): void {
  console.error(message)
  process.exitCode = ExitCode.UsageError
}
