import type { CommonFlags, PhaseTimings } from './types'
import { shouldPrintHumanSummary, type OutputSink } from './output'

export function parseMilliseconds(value: CommonFlags['watchDebounce']): number | undefined {
  if (value === undefined) return undefined

  const number = typeof value === 'number' ? value : Number(value)

  return Number.isFinite(number) && number >= 0 ? number : undefined
}

export function time<T>(timings: PhaseTimings | undefined, name: string, task: () => T): T {
  const startedAt = performance.now()

  try {
    return task()
  } finally {
    // Watch mode can run the same phase repeatedly, so phase times accumulate.
    if (timings) timings[name] = Math.round((timings[name] ?? 0) + performance.now() - startedAt)
  }
}

export async function timeAsync<T>(timings: PhaseTimings, name: string, task: () => Promise<T>): Promise<T> {
  const startedAt = performance.now()

  try {
    return await task()
  } finally {
    // Watch mode can run the same phase repeatedly, so phase times accumulate.
    timings[name] = Math.round((timings[name] ?? 0) + performance.now() - startedAt)
  }
}

export function renderTimings(command: string, timings: PhaseTimings, output: OutputSink, flags: CommonFlags): void {
  if (!flags.verbose || !shouldPrintHumanSummary(flags)) return

  const entries = Object.entries(timings)

  if (entries.length === 0) return

  output.log([`${command}: timings`, ...entries.map(([name, ms]) => `${name}: ${ms}ms`)].join('\n'))
}
