import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export function readPandaVersion(): string | undefined {
  try {
    const pkgPath = join(dirname(fileURLToPath(import.meta.url)), '../package.json')
    return (JSON.parse(readFileSync(pkgPath, 'utf8')) as { version?: string }).version
  } catch {
    return undefined
  }
}

export function runningPandaRange(): string | undefined {
  const match = readPandaVersion()?.match(/\d+/)
  return match ? `^${match[0]}.0.0` : undefined
}

export function isStampablePandaRange(range: string | undefined): range is string {
  return range !== undefined && /^[v=><~^]|^\d/.test(range.trim())
}
