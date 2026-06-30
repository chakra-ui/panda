import type { DesignSystemManifestImportMap } from '@pandacss/compiler-shared'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

export interface PackageIdentity {
  name: string
  version?: string
  pandaPeer?: string
  packagePath: string
}

export function readPackageIdentity(cwd: string): PackageIdentity {
  const packagePath = nearestPackageJson(cwd)
  if (packagePath === undefined) {
    throw new Error(`Could not find a package.json from ${JSON.stringify(cwd)} to build the design system manifest.`)
  }
  const pkg = JSON.parse(readFileSync(packagePath, 'utf8')) as Record<string, unknown>
  const name = pkg.name
  if (typeof name !== 'string' || name.length === 0) {
    throw new Error(`${JSON.stringify(packagePath)} has no "name"; a design system must be a named package.`)
  }
  const peer = (pkg.peerDependencies as Record<string, string> | undefined)?.['@pandacss/dev']
  return {
    name,
    version: typeof pkg.version === 'string' ? pkg.version : undefined,
    pandaPeer: typeof peer === 'string' ? peer : undefined,
    packagePath,
  }
}

export function defaultImportMap(name: string): DesignSystemManifestImportMap {
  return {
    css: `${name}/css`,
    recipes: `${name}/recipes`,
    patterns: `${name}/patterns`,
    jsx: `${name}/jsx`,
    tokens: `${name}/tokens`,
  }
}

export interface SyncExportsResult {
  changed: boolean
  json: string
}

export interface SyncExportsOptions {
  packageJson: string
  entries: Record<string, string>
}

export function syncExports(options: SyncExportsOptions): SyncExportsResult {
  const { packageJson, entries } = options
  const pkg = JSON.parse(packageJson) as Record<string, unknown>
  const existing = normalizeExports(pkg.exports)
  const merged: Record<string, unknown> = { ...existing }
  for (const [key, value] of Object.entries(entries)) merged[key] = value

  const changed = JSON.stringify(pkg.exports) !== JSON.stringify(merged)
  const out = { ...pkg, exports: merged }
  return { changed, json: `${JSON.stringify(out, null, 2)}\n` }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeExports(exports: unknown): Record<string, unknown> {
  if (exports === undefined) return {}
  if (typeof exports === 'string') return { '.': exports }
  if (!isPlainObject(exports)) return {}
  if (isSubpathExportMap(exports)) return exports
  return { '.': exports }
}

function isSubpathExportMap(exports: Record<string, unknown>): boolean {
  return Object.keys(exports).some((key) => key === '.' || key.startsWith('./'))
}

function nearestPackageJson(start: string): string | undefined {
  let current = start
  while (true) {
    const candidate = join(current, 'package.json')
    if (existsSync(candidate)) return candidate
    const parent = dirname(current)
    if (parent === current) return undefined
    current = parent
  }
}
