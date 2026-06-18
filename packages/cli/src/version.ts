import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

interface PackageJson {
  version?: string
}

export function readCliVersion(): string {
  const pkgPath = join(dirname(fileURLToPath(import.meta.url)), '../package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as PackageJson
  return pkg.version ?? '0.0.0'
}
