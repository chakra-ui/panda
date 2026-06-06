import * as parcelWatcher from '@parcel/watcher'
import { dirname, isAbsolute, relative, resolve } from 'node:path'
import type { Driver, SourceChange } from '@pandacss/compiler'

export type WatchEvent = SourceChange

export interface WatchBatch {
  source: WatchEvent[]
  config: WatchEvent[]
}

export interface ProjectWatchOptions {
  driver: Driver
  cwd: string
  outdir: string | (() => string)
  debounceMs?: number
  onStatus?(message: string): void
  onError?(error: unknown): void
  onSourceChange(events: WatchEvent[]): Promise<void> | void
  onConfigChange(events: WatchEvent[]): Promise<void> | void
}

export function formatWatchError(error: unknown): string {
  if (error instanceof Error) return error.stack ?? error.message
  return String(error)
}

export function normalizeParcelEvent(event: { type: string; path: string }): WatchEvent | undefined {
  if (event.type === 'create') return { kind: 'add', path: event.path }
  if (event.type === 'update') return { kind: 'change', path: event.path }
  if (event.type === 'delete') return { kind: 'unlink', path: event.path }
  return undefined
}

export function createEventDebouncer<T>(callback: (events: T[]) => void | Promise<void>, delay = 50) {
  let timer: ReturnType<typeof setTimeout> | undefined
  let pending: T[] = []

  const flush = async () => {
    if (timer) clearTimeout(timer)
    timer = undefined
    if (pending.length === 0) return
    const events = pending
    pending = []
    await callback(events)
  }

  return {
    push(events: T[]) {
      pending.push(...events)
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => void flush(), delay)
    },
    flush,
    close() {
      if (timer) clearTimeout(timer)
      timer = undefined
      pending = []
    },
  }
}

export async function handleWatchBatch(
  driver: Pick<Driver, 'applyChanges' | 'reload'>,
  batch: WatchBatch,
): Promise<void> {
  if (batch.config.length > 0) {
    const diff = await driver.reload()
    if (!diff.hasChanged) return
  }
  if (batch.source.length > 0) {
    driver.applyChanges(batch.source)
  }
}

export async function startProjectWatch(options: ProjectWatchOptions): Promise<() => Promise<void>> {
  const targets = options.driver.watchTargets()
  const configFiles = new Set(targets.config.map((path) => resolve(options.cwd, path)))
  const configDirs = new Set([...configFiles].map((path) => dirname(path)))
  const sourceDirs = new Set(targets.dirs.map((dir) => resolve(options.cwd, dir)))
  const debounceMs = options.debounceMs ?? 0
  let serialGate: Promise<void> = Promise.resolve()
  const currentOutdir = () => (typeof options.outdir === 'function' ? options.outdir() : options.outdir)

  const runSerialized = (task: () => Promise<void>): Promise<void> => {
    // Rebuilds must not overlap; each batch waits for the previous one to settle.
    serialGate = serialGate.then(task).catch((error) => {
      options.onStatus?.('watch: rebuild failed')
      options.onError?.(error)
    })
    return serialGate
  }

  const debouncer = createEventDebouncer<WatchEvent>(async (events) => {
    const batch = splitEvents(events, options.driver)
    await runSerialized(async () => {
      options.onStatus?.(formatWatchRebuildStart(batch))
      if (batch.config.length > 0) {
        await options.onConfigChange(batch.config)
        options.onStatus?.(formatWatchRebuildSuccess(batch))
        return
      }
      if (batch.source.length > 0) {
        await options.onSourceChange(batch.source)
        options.onStatus?.(formatWatchRebuildSuccess(batch))
      }
    })
  }, debounceMs)

  const subscriptions: parcelWatcher.AsyncSubscription[] = []
  const subscribe = async (dir: string, filter?: (event: WatchEvent) => boolean) => {
    const subscription = await parcelWatcher.subscribe(
      dir,
      (error, events) => {
        if (error) throw error
        const normalized = events
          .map((event) => normalizeParcelEvent(event))
          .filter((event): event is WatchEvent => !!event)
          .filter((event) => !isOutputEvent(options.cwd, currentOutdir(), event))
          .filter((event) => !filter || filter(event))
        if (normalized.length > 0) debouncer.push(normalized)
      },
      { ignore: ['**/node_modules/**', '**/.git/**', `${currentOutdir()}/**`] },
    )
    subscriptions.push(subscription)
  }

  await Promise.all([
    ...[...sourceDirs].map((dir) => subscribe(dir)),
    ...[...configDirs].map((dir) => subscribe(dir, (event) => options.driver.isConfigFile(event.path))),
  ])
  options.onStatus?.(
    formatWatchReady({
      sourceDirs: sourceDirs.size,
      configFiles: configFiles.size + (options.driver.configPath ? 1 : 0),
      debounceMs,
      outdir: currentOutdir(),
    }),
  )

  let stopped = false
  const stop = async () => {
    if (stopped) return
    stopped = true
    debouncer.close()
    await Promise.all(subscriptions.map((subscription) => subscription.unsubscribe()))

    // Tests and embedded callers may start multiple watchers in one process.
    process.off('SIGINT', exit)
    process.off('SIGTERM', exit)
    options.onStatus?.('watch: stopped')
  }

  const exit = () => {
    void stop().finally(() => process.exit(0))
  }
  process.once('SIGINT', exit)
  process.once('SIGTERM', exit)

  return stop
}

export function formatWatchReady(summary: {
  sourceDirs: number
  configFiles: number
  debounceMs: number
  outdir: string
}): string {
  return `watch: ready (${summary.sourceDirs} source dirs, ${summary.configFiles} config files, debounce ${summary.debounceMs}ms, outdir ${summary.outdir})`
}

export function formatWatchRebuildStart(batch: WatchBatch): string {
  return `watch: rebuilding (${batch.source.length} source, ${batch.config.length} config)`
}

export function formatWatchRebuildSuccess(batch: WatchBatch): string {
  if (batch.config.length > 0) return 'watch: config reloaded'
  return `watch: rebuilt ${batch.source.length} source events`
}

export function isOutputEvent(cwd: string, outdir: string, event: WatchEvent): boolean {
  const outputDir = resolve(cwd, outdir)
  const target = resolve(cwd, event.path)
  const path = relative(outputDir, target)
  return path === '' || (!!path && !path.startsWith('..') && !isAbsolute(path))
}

function splitEvents(events: WatchEvent[], driver: Pick<Driver, 'isConfigFile'>): WatchBatch {
  const batch: WatchBatch = { source: [], config: [] }
  for (const event of events) {
    if (driver.isConfigFile(event.path)) batch.config.push(event)
    else batch.source.push(event)
  }
  return batch
}
