import { performance } from 'node:perf_hooks'
import { gzipSync } from 'node:zlib'

export function timed<T>(fn: () => T): [ms: number, value: T] {
  const start = performance.now()
  const value = fn()
  return [performance.now() - start, value]
}

export function median(xs: number[]): number {
  const sorted = [...xs].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

const ROUND_DECIMALS = 3

export const round = (n: number): number => {
  const factor = 10 ** ROUND_DECIMALS
  return Math.round(n * factor) / factor
}
export const bytes = (s: string): number => Buffer.byteLength(s, 'utf8')
export const gzip = (s: string): number => gzipSync(s).length
