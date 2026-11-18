import { existsSync } from 'node:fs'
import { dirname, join, resolve, sep } from 'node:path'
import { createFilesMatcher, parseTsconfig, type TsConfigResult } from 'get-tsconfig'

/**
 * Pick the tsconfig whose `paths` the config bundle should use: the project that owns the config file, else the
 * first referenced project with `paths` (Vite's `tsconfig.app.json`). Returns `undefined` when no candidate has
 * `paths`, leaving Rolldown's own discovery in charge.
 */
export function resolveConfigTsconfig(file: string, cwd: string): string | undefined {
  const configFile = resolve(cwd, file)
  if (configFile.includes(`${sep}node_modules${sep}`)) return undefined

  const closest = readTsconfig(findClosestTsconfig(configFile, resolve(cwd)))
  if (!closest) return undefined

  const references = (closest.config.references ?? []).flatMap((reference) => {
    const target = resolve(dirname(closest.path), reference.path)
    const tsconfig = readTsconfig(target.endsWith('.json') ? target : join(target, 'tsconfig.json'))
    return tsconfig ? [tsconfig] : []
  })

  const owner = [closest, ...references].find((tsconfig) => createFilesMatcher(tsconfig)(configFile)) ?? closest
  return [owner, ...references].find(hasPaths)?.path
}

function findClosestTsconfig(file: string, root: string): string | undefined {
  for (let dir = dirname(file); ; dir = dirname(dir)) {
    const candidate = join(dir, 'tsconfig.json')
    if (existsSync(candidate)) return candidate
    if (dir === root || dirname(dir) === dir) return undefined
  }
}

function readTsconfig(path: string | undefined): TsConfigResult | undefined {
  if (!path || !existsSync(path)) return undefined
  try {
    return { path, config: parseTsconfig(path) }
  } catch {
    return undefined
  }
}

function hasPaths(tsconfig: TsConfigResult): boolean {
  return Object.keys(tsconfig.config.compilerOptions?.paths ?? {}).length > 0
}
