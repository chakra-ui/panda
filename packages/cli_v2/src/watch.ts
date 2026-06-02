import * as parcelWatcher from '@parcel/watcher'
import { dirname, resolve } from 'node:path'
import type { Driver, SourceChange } from '@pandacss/compiler'

export type WatchEvent = SourceChange

export interface WatchBatch {
  source: WatchEvent[]
  config: WatchEvent[]
}

export interface ProjectWatchOptions {
  driver: Driver
  cwd: string
  outdir: string
  debounceMs?: number
  onSourceChange(events: WatchEvent[]): Promise<void> | void
  onConfigChange(events: WatchEvent[]): Promise<void> | void
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

  const debouncer = createEventDebouncer<WatchEvent>(async (events) => {
    const batch = splitEvents(events, options.driver)
    if (batch.config.length > 0) {
      await options.onConfigChange(batch.config)
      return
    }
    if (batch.source.length > 0) {
      await options.onSourceChange(batch.source)
    }
  }, options.debounceMs ?? 0)

  const subscriptions: parcelWatcher.AsyncSubscription[] = []
  const subscribe = async (dir: string, filter?: (event: WatchEvent) => boolean) => {
    const subscription = await parcelWatcher.subscribe(
      dir,
      (error, events) => {
        if (error) throw error
        const normalized = events
          .map((event) => normalizeParcelEvent(event))
          .filter((event): event is WatchEvent => !!event)
          .filter((event) => !filter || filter(event))
        if (normalized.length > 0) debouncer.push(normalized)
      },
      { ignore: ['**/node_modules/**', '**/.git/**', `${options.outdir}/**`] },
    )
    subscriptions.push(subscription)
  }

  await Promise.all([
    ...[...sourceDirs].map((dir) => subscribe(dir)),
    ...[...configDirs].map((dir) => subscribe(dir, (event) => options.driver.isConfigFile(event.path))),
  ])

  const stop = async () => {
    debouncer.close()
    await Promise.all(subscriptions.map((subscription) => subscription.unsubscribe()))
  }

  const exit = () => {
    void stop().finally(() => process.exit(0))
  }
  process.once('SIGINT', exit)
  process.once('SIGTERM', exit)

  return stop
}

function splitEvents(events: WatchEvent[], driver: Pick<Driver, 'isConfigFile'>): WatchBatch {
  const batch: WatchBatch = { source: [], config: [] }
  for (const event of events) {
    if (driver.isConfigFile(event.path)) batch.config.push(event)
    else batch.source.push(event)
  }
  return batch
}
