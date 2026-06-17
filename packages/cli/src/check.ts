import { existsSync, readFileSync } from 'node:fs'
import type { CheckOutput } from './schema'

export function checkExpectedFiles(expected: Array<{ path: string; code: string }>): CheckOutput {
  const missing: string[] = []
  const stale: string[] = []

  for (const file of expected) {
    if (!existsSync(file.path)) {
      missing.push(file.path)
      continue
    }

    if (readFileSync(file.path, 'utf8') !== file.code) {
      stale.push(file.path)
    }
  }

  return {
    files: expected.map((file) => file.path),
    missing,
    stale,
  }
}

export function isCheckClean(result: Pick<CheckOutput, 'missing' | 'stale'>): boolean {
  return result.missing.length === 0 && result.stale.length === 0
}

export function formatCheckSummary(command: string, result: CheckOutput, target: string): string {
  const checked = `${command}: checked ${result.files.length} files in ${target}`

  if (isCheckClean(result)) return checked

  return `${checked}\nmissing: ${result.missing.length}\nstale: ${result.stale.length}`
}
