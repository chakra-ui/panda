import { describe, expect, it, vi } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  createEventDebouncer,
  formatWatchChange,
  formatWatchReady,
  formatWatchRebuildStart,
  formatWatchRebuildSuccess,
  handleWatchBatch,
  isOutputEvent,
  isWatchableDirectory,
  normalizeParcelEvent,
} from '../src/watch'
import { createWatchLogger } from '../src/watch-logger'

describe('watch helpers', () => {
  it('normalizes parcel event types', () => {
    expect(normalizeParcelEvent({ type: 'create', path: '/x.tsx' })).toEqual({ kind: 'add', path: '/x.tsx' })
    expect(normalizeParcelEvent({ type: 'update', path: '/x.tsx' })).toEqual({ kind: 'change', path: '/x.tsx' })
    expect(normalizeParcelEvent({ type: 'delete', path: '/x.tsx' })).toEqual({ kind: 'unlink', path: '/x.tsx' })
  })

  it('debounces multiple events into one batch', async () => {
    vi.useFakeTimers()
    const calls: string[][] = []
    const debouncer = createEventDebouncer<string>((events) => void calls.push(events), 50)

    debouncer.push(['a'])
    debouncer.push(['b'])
    await vi.advanceTimersByTimeAsync(50)

    expect(calls).toEqual([['a', 'b']])
    vi.useRealTimers()
  })

  it('routes source events through applyChanges', async () => {
    const driver = {
      applyChanges: vi.fn(),
      reload: vi.fn(),
    } as any

    await handleWatchBatch(driver, {
      source: [{ kind: 'change', path: '/src/App.tsx' }],
      config: [],
    })

    expect(driver.applyChanges).toHaveBeenCalledWith([{ kind: 'change', path: '/src/App.tsx' }])
    expect(driver.reload).not.toHaveBeenCalled()
  })

  it('routes config events through reload before source changes', async () => {
    const driver = {
      applyChanges: vi.fn(),
      reload: vi.fn().mockResolvedValue({ hasChanged: true }),
    } as any

    await handleWatchBatch(driver, {
      source: [{ kind: 'change', path: '/src/App.tsx' }],
      config: [{ kind: 'change', path: '/panda.config.ts' }],
    })

    expect(driver.reload).toHaveBeenCalledTimes(1)
    expect(driver.applyChanges).toHaveBeenCalledWith([{ kind: 'change', path: '/src/App.tsx' }])
  })

  it('detects generated output events under the current outdir', () => {
    expect(
      isOutputEvent('/project', 'styled-system', { kind: 'change', path: '/project/styled-system/css/css.mjs' }),
    ).toBe(true)
    expect(
      isOutputEvent('/project', '/tmp/panda-system', { kind: 'change', path: '/tmp/panda-system/styles.css' }),
    ).toBe(true)
    expect(isOutputEvent('/project', 'styled-system', { kind: 'change', path: 'styled-system/styles.css' })).toBe(true)
    expect(isOutputEvent('/project', 'styled-system', { kind: 'change', path: '/project/src/App.tsx' })).toBe(false)
  })

  it('only treats existing directories as watchable', () => {
    const dir = mkdtempSync(join(tmpdir(), 'panda-watch-'))
    const file = join(dir, 'source.tsx')

    writeFileSync(file, '')

    try {
      expect(isWatchableDirectory(dir)).toBe(true)
      expect(isWatchableDirectory(file)).toBe(false)
      expect(isWatchableDirectory(join(dir, 'missing'))).toBe(false)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('formats watch lifecycle status messages', () => {
    const batch = {
      source: [{ kind: 'change' as const, path: '/src/App.tsx' }],
      config: [],
    }

    expect(formatWatchChange('/project', batch)).toMatchInlineSnapshot(`"watch: source changed /src/App.tsx"`)
    expect(
      formatWatchChange('/project', {
        source: [{ kind: 'change', path: '/project/src/App.tsx' }],
        config: [],
      }),
    ).toMatchInlineSnapshot(`"watch: source changed src/App.tsx"`)
    expect(
      formatWatchChange('/project', {
        source: [],
        config: [
          { kind: 'change', path: '/project/panda.config.ts' },
          { kind: 'change', path: '/project/panda.theme.ts' },
        ],
      }),
    ).toMatchInlineSnapshot(`"watch: 2 config files changed"`)
    expect(
      formatWatchReady({ sourceDirs: 2, configFiles: 1, debounceMs: 25, outdir: 'styled-system' }),
    ).toMatchInlineSnapshot(`"watch: ready (2 source dirs, 1 config files, debounce 25ms, outdir styled-system)"`)
    expect(formatWatchRebuildStart(batch)).toMatchInlineSnapshot(`"watch: rebuilding (1 source, 0 config)"`)
    expect(formatWatchRebuildSuccess(batch)).toMatchInlineSnapshot(`"watch: rebuilt 1 source events"`)
    expect(
      formatWatchRebuildSuccess({ source: [], config: [{ kind: 'change', path: '/panda.config.ts' }] }),
    ).toMatchInlineSnapshot(`"watch: config reloaded"`)
  })

  it('suppresses repeated watch log messages', () => {
    const logs: string[] = []
    const logger = createWatchLogger({ log: (message) => logs.push(message), error: (message) => logs.push(message) })

    logger.log('watch: rebuilt 1 source events')
    logger.log('watch: rebuilt 1 source events')
    logger.log('watch: rebuilt 1 source events')
    logger.log('watch: source changed src/App.tsx')
    logger.log('watch: rebuilt 1 source events')
    logger.error('watch: rebuild failed')
    logger.log('watch: rebuilt 1 source events')
    logger.log('watch: rebuilt 1 source events')

    expect(logs).toMatchInlineSnapshot(`
      [
        "watch: rebuilt 1 source events",
        "watch: source changed src/App.tsx",
        "watch: rebuild failed",
        "watch: rebuilt 1 source events",
      ]
    `)
  })

  it('can suppress variable watch messages with a stable key', () => {
    const logs: string[] = []
    const logger = createWatchLogger({ log: (message) => logs.push(message) })

    logger.log('analyze: refreshed source changed src/App.tsx in 18ms', { dedupeKey: 'refresh:src/App.tsx' })
    logger.log('analyze: refreshed source changed src/App.tsx in 12ms', { dedupeKey: 'refresh:src/App.tsx' })

    expect(logs).toMatchInlineSnapshot(`
      [
        "analyze: refreshed source changed src/App.tsx in 18ms",
      ]
    `)
  })
})
