import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const STATE_DIR = '.panda'
const STATE_FILE = 'design-system-state.json'

export interface DesignSystemVersion {
  name: string
  version?: string
}

export interface DriftEntry {
  name: string
  from?: string
  to: string
}

export function readDriftState(cwd: string): Record<string, string> {
  try {
    const parsed = JSON.parse(readFileSync(join(cwd, STATE_DIR, STATE_FILE), 'utf8'))
    return isStringRecord(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

export function diffDrift(prev: Record<string, string>, chain: DesignSystemVersion[]): DriftEntry[] {
  const entries: DriftEntry[] = []
  for (const level of chain) {
    if (level.version === undefined) continue
    if (prev[level.name] !== level.version)
      entries.push({ name: level.name, from: prev[level.name], to: level.version })
  }
  return entries
}

export function writeDriftState(cwd: string, chain: DesignSystemVersion[]): void {
  const next: Record<string, string> = {}
  for (const level of chain) if (level.version !== undefined) next[level.name] = level.version

  const dir = join(cwd, STATE_DIR)
  mkdirSync(dir, { recursive: true })
  const target = join(dir, STATE_FILE)
  const tmp = join(dir, `${STATE_FILE}.${process.pid}.tmp`)
  writeFileSync(tmp, `${JSON.stringify(next, null, 2)}\n`)
  renameSync(tmp, target)
}

export function formatDrift(entry: DriftEntry): string {
  return `[designSystem] ${entry.name}: ${entry.from ?? '(new)'} → ${entry.to}`
}

export function recordDrift(cwd: string, chain: DesignSystemVersion[]): string[] {
  if (chain.length === 0) return []
  const receipts = diffDrift(readDriftState(cwd), chain).map(formatDrift)
  writeDriftState(cwd, chain)
  return receipts
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((entry) => typeof entry === 'string')
  )
}
