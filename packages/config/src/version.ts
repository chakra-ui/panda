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
