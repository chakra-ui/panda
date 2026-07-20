import type { TsConfigJsonResolved } from 'get-tsconfig'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { findClosestTsconfig, resolveSolutionTsconfigForFile } from './tsconfig-utils'

function hasPathMappings(tsconfig: TsConfigJsonResolved) {
  const paths = tsconfig.compilerOptions?.paths
  return Boolean(paths && Object.keys(paths).length > 0)
}

function resolveReferencedTsconfigPath(refPath: string, fromDir: string, configName = 'tsconfig.json') {
  const p = refPath.endsWith('.json') ? refPath : path.join(refPath, configName)
  return path.resolve(fromDir, p)
}

/**
 * Resolve the tsconfig file esbuild should use when bundling a config file.
 *
 * 1. Prefer the project that owns the config file (inclusion / references).
 * 2. If that project has no `paths`, fall back to the first referenced project
 *    that defines them (Vite: config owned by tsconfig.node.json, aliases on
 *    tsconfig.app.json).
 */
export async function resolveTsconfigForConfigBundle(configFile: string, cwd: string): Promise<string | undefined> {
  const closest = await findClosestTsconfig(configFile, cwd)
  if (!closest) return undefined

  const gtc = await import('get-tsconfig')

  let rootParsed: TsConfigJsonResolved
  try {
    rootParsed = gtc.parseTsconfig(closest)
  } catch {
    return closest
  }

  const owned = await resolveSolutionTsconfigForFile(path.resolve(configFile), closest, rootParsed, gtc)

  if (hasPathMappings(owned.tsconfig)) {
    return owned.tsconfigFile
  }

  const refs = rootParsed.references
  if (!refs?.length) {
    return owned.tsconfigFile
  }

  const rootDir = path.dirname(closest)
  for (const ref of refs) {
    const refPath = resolveReferencedTsconfigPath(ref.path, rootDir)
    try {
      await fs.access(refPath)
    } catch {
      continue
    }

    try {
      const childParsed = gtc.parseTsconfig(refPath)
      if (hasPathMappings(childParsed)) {
        return refPath
      }
    } catch {
      continue
    }
  }

  return owned.tsconfigFile
}
