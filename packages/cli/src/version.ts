import { readFileSync } from 'node:fs'

interface PackageJson {
  version?: string
}

export function readCliVersion(): string {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as PackageJson
  return pkg.version ?? '0.0.0'
}
