import type { CommonFlags, PhaseTimings } from './schema'
import { allowsLogLevel, shouldPrintHumanSummary, type OutputSink } from './output'

export function parseMilliseconds(value: CommonFlags['watchDebounce']): number | undefined {
  if (value === undefined) return undefined

  const number = typeof value === 'number' ? value : Number(value)

  return Number.isFinite(number) && number >= 0 ? number : undefined
}

export interface TimeOptions<T> {
  timings?: PhaseTimings
  phase: string
  run: () => T
}

export interface TimeAsyncOptions<T> {
  timings: PhaseTimings
  phase: string
  run: () => Promise<T>
}

export function time<T>({ timings, phase, run }: TimeOptions<T>): T {
  const startedAt = performance.now()

  try {
    return run()
  } finally {
    // Watch mode can run the same phase repeatedly, so phase times accumulate.
    if (timings) timings[phase] = Math.round((timings[phase] ?? 0) + performance.now() - startedAt)
  }
}

export async function timeAsync<T>({ timings, phase, run }: TimeAsyncOptions<T>): Promise<T> {
  const startedAt = performance.now()

  try {
    return await run()
  } finally {
    // Watch mode can run the same phase repeatedly, so phase times accumulate.
    timings[phase] = Math.round((timings[phase] ?? 0) + performance.now() - startedAt)
  }
}

export interface RenderTimingsOptions {
  command: string
  timings: PhaseTimings
  output: OutputSink
  flags: CommonFlags
}

export function renderTimings({ command, timings, output, flags }: RenderTimingsOptions): void {
  if (!allowsLogLevel(flags, 'debug') || !shouldPrintHumanSummary(flags)) return

  const entries = Object.entries(timings)

  if (entries.length === 0) return

  output.log([`${command}: timings`, ...entries.map(([name, ms]) => `${name}: ${ms}ms`)].join('\n'))
}
