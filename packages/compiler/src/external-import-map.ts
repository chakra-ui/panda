import { existsSync, realpathSync } from 'node:fs'
import { basename, dirname, isAbsolute, join, sep } from 'node:path'

export interface ExternalImportMapInput {
  cwd: string
  outdir: string
  importMap: unknown
  designSystem: boolean
}

export function isExternalImportMap(input: ExternalImportMapInput): boolean {
  if (input.designSystem) return false

  const specifiers = importMapSpecifiers(input.importMap)
  if (!specifiers.length) return false

  const outdir = toRealPath(input.outdir)
  const outdirName = basename(input.outdir)

  return specifiers.every((specifier) => {
    if (specifier.startsWith('.') || isAbsolute(specifier)) return false

    const name = packageName(specifier)
    if (name === outdirName) return false

    const dir = installedPackageDir(input.cwd, name)
    if (!dir) return false

    const pkg = toRealPath(dir)
    return !isInside(pkg, outdir) && !isInside(outdir, pkg)
  })
}

function importMapSpecifiers(importMap: unknown): string[] {
  if (!importMap || typeof importMap !== 'object') return []
  return Object.values(importMap)
    .flat()
    .filter((specifier): specifier is string => typeof specifier === 'string')
}

function installedPackageDir(cwd: string, name: string): string | undefined {
  for (let dir = cwd; ; dir = dirname(dir)) {
    const candidate = join(dir, 'node_modules', name)
    if (existsSync(join(candidate, 'package.json'))) return candidate
    if (dirname(dir) === dir) return undefined
  }
}

function packageName(specifier: string) {
  const parts = specifier.split('/')
  return parts.slice(0, specifier.startsWith('@') ? 2 : 1).join('/')
}

function toRealPath(file: string): string {
  if (existsSync(file)) return realpathSync(file)
  const parent = dirname(file)
  return parent === file ? file : join(toRealPath(parent), basename(file))
}

const isInside = (child: string, parent: string) => child === parent || child.startsWith(parent + sep)
