import { convertTsPathsToRegexes } from '@pandacss/config'
import type { LoadConfigResult, LoadTsConfigResult } from '@pandacss/types'
import { parse } from 'tsconfck'

export async function loadTsConfig(conf: LoadConfigResult, cwd: string): Promise<LoadTsConfigResult | undefined> {
  const tsconfigResult = await parse(conf.path, {
    root: cwd,
    //@ts-ignore
    resolveWithEmptyIfConfigNotFound: true,
  })

  if (!tsconfigResult) return

  const { tsconfig, tsconfigFile } = tsconfigResult
  const { compilerOptions } = tsconfig

  const result: LoadTsConfigResult = {
    tsconfig,
    tsconfigFile,
  }

  if (compilerOptions?.paths) {
    const baseUrl = compilerOptions.baseUrl
    result.tsOptions = {
      baseUrl,
      pathMappings: convertTsPathsToRegexes(compilerOptions.paths, baseUrl ?? cwd),
    }
  }

  return result
}
