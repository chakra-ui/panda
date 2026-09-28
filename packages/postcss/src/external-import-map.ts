import { existsSync, realpathSync } from 'fs'
import { createRequire } from 'module'
import path from 'path'

interface Config {
  cwd: string
  outdir?: string
  importMap?: unknown
}

export function getExternalImportMap(config: Config): string[] | undefined {
  const entries = [config.importMap ?? []].flat()
  if (!entries.length) return

  const outdir = toRealPath(path.resolve(config.cwd, config.outdir ?? 'styled-system'))
  const lookupPaths = createRequire(path.join(config.cwd, 'package.json')).resolve.paths('pkg') ?? []

  const isExternal = (entry: unknown): entry is string => {
    if (typeof entry !== 'string' || entry.startsWith('.') || path.isAbsolute(entry)) return false
    const dir = lookupPaths.map((nodeModules) => path.join(nodeModules, entry)).find((dir) => existsSync(dir))
    if (!dir) return false
    const pkg = toRealPath(dir)
    return !isInside(pkg, outdir) && !isInside(outdir, pkg)
  }

  return entries.every(isExternal) ? (entries as string[]) : undefined
}

const toRealPath = (file: string) => (existsSync(file) ? realpathSync(file) : file)

const isInside = (child: string, parent: string) => child === parent || child.startsWith(parent + path.sep)
