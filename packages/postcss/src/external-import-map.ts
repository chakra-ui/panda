import { existsSync, realpathSync } from 'fs'
import { createRequire } from 'module'
import path from 'path'

interface Config {
  cwd: string
  outdir: string
}

export function getExternalPackages(config: Config, mods: string[]): string[] | undefined {
  const names = [...new Set(mods.map(toPackageName))]
  if (!names.length) return

  const outdir = toRealPath(path.resolve(config.cwd, config.outdir))
  const lookupPaths = createRequire(path.join(config.cwd, 'package.json')).resolve.paths('pkg') ?? []

  const isExternal = (name: string | undefined) => {
    if (!name || name === path.basename(outdir)) return false
    const dir = lookupPaths.map((nodeModules) => path.join(nodeModules, name)).find((dir) => existsSync(dir))
    if (!dir) return false
    const pkg = toRealPath(dir)
    return !isInside(pkg, outdir) && !isInside(outdir, pkg)
  }

  return names.every(isExternal) ? (names as string[]) : undefined
}

const toPackageName = (mod: string) => {
  if (mod.startsWith('.') || path.isAbsolute(mod)) return
  const parts = mod.split('/')
  return mod.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]
}

const toRealPath = (file: string): string =>
  existsSync(file) ? realpathSync(file) : path.join(toRealPath(path.dirname(file)), path.basename(file))

const isInside = (child: string, parent: string) => child === parent || child.startsWith(parent + path.sep)
