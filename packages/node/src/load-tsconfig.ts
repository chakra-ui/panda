import { convertTsPathsToRegexes } from '@pandacss/config'
import type { LoadTsConfigResult } from '@pandacss/types'

export async function loadTsConfig(cwd: string): Promise<LoadTsConfigResult | undefined> {
  const { parse } = await import('tsconfck')

  const tsconfigResult = await parse(cwd + '/tsconfig.json', {
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
    customConditions: compilerOptions.customConditions ?? [],
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
