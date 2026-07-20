import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const MAJOR_VERSION_RE = /\d+/
const STAMPABLE_PANDA_RANGE_RE = /^[v=><~^]|^\d/

export function readPandaVersion(): string | undefined {
  try {
    const pkgPath = join(dirname(fileURLToPath(import.meta.url)), '../package.json')
    return (JSON.parse(readFileSync(pkgPath, 'utf8')) as { version?: string }).version
  } catch {
    return undefined
  }
}

export function getPandaMajorRange(): string | undefined {
  const match = readPandaVersion()?.match(MAJOR_VERSION_RE)
  return match ? `^${match[0]}.0.0` : undefined
}

export function isStampablePandaRange(range: string | undefined): range is string {
  return range !== undefined && STAMPABLE_PANDA_RANGE_RE.test(range.trim())
}
