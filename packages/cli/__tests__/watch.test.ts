import { describe, expect, it, vi } from 'vitest'
import {
  createEventDebouncer,
  formatWatchReady,
  formatWatchRebuildStart,
  formatWatchRebuildSuccess,
  handleWatchBatch,
  isOutputEvent,
  normalizeParcelEvent,
} from '../src/watch'

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

  it('formats watch lifecycle status messages', () => {
    const batch = {
      source: [{ kind: 'change' as const, path: '/src/App.tsx' }],
      config: [],
    }

    expect(
      formatWatchReady({ sourceDirs: 2, configFiles: 1, debounceMs: 25, outdir: 'styled-system' }),
    ).toMatchInlineSnapshot(`"watch: ready (2 source dirs, 1 config files, debounce 25ms, outdir styled-system)"`)
    expect(formatWatchRebuildStart(batch)).toMatchInlineSnapshot(`"watch: rebuilding (1 source, 0 config)"`)
    expect(formatWatchRebuildSuccess(batch)).toMatchInlineSnapshot(`"watch: rebuilt 1 source events"`)
    expect(
      formatWatchRebuildSuccess({ source: [], config: [{ kind: 'change', path: '/panda.config.ts' }] }),
    ).toMatchInlineSnapshot(`"watch: config reloaded"`)
  })
})
