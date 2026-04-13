import { convertTsPathsToRegexes } from '@pandacss/config'
import type { LoadConfigResult, LoadTsConfigResult } from '@pandacss/types'
import path from 'node:path'

import {
  findClosestTsconfig,
  resolveBaseUrlForCompilerOptions,
  resolveDirectTsconfigJson,
  resolveSolutionTsconfigForFile,
} from './tsconfig-utils'

export async function loadTsConfig(conf: LoadConfigResult, cwd: string): Promise<LoadTsConfigResult | undefined> {
  const root = cwd

  let tsconfigFile: string | null = await resolveDirectTsconfigJson(conf.path)
  if (!tsconfigFile) {
    tsconfigFile = await findClosestTsconfig(conf.path, root, 'tsconfig.json')
  }

  if (!tsconfigFile) {
    return {
      tsconfig: {},
      tsconfigFile: undefined,
    }
  }

  const gtc = await import('get-tsconfig')
  const rootParsed = gtc.parseTsconfig(tsconfigFile)
  const { tsconfig, tsconfigFile: effectiveTsconfigPath } = await resolveSolutionTsconfigForFile(
    path.resolve(conf.path),
    tsconfigFile,
    rootParsed,
    gtc,
  )
  const compilerOptions = tsconfig?.compilerOptions

  const result: LoadTsConfigResult = {
    tsconfig,
    tsconfigFile: effectiveTsconfigPath,
  }

  if (compilerOptions?.paths) {
    const baseUrl = compilerOptions.baseUrl
    result.tsOptions = {
      baseUrl,
      pathMappings: convertTsPathsToRegexes(
        compilerOptions.paths,
        resolveBaseUrlForCompilerOptions(baseUrl, effectiveTsconfigPath, cwd),
      ),
    }
  }

  return result
}
