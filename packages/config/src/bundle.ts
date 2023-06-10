import type { Config } from '@pandacss/types'
import createJITI from 'jiti'
import { getConfigDependencies } from './get-mod-deps'
import { logger } from '@pandacss/logger'
import { parse } from 'tsconfck'
import { transform } from 'sucrase'
import { convertTsPathsToRegexes } from './ts-config-paths-mappings'

const isJs = (filePath: string) => filePath.endsWith('.js') || filePath.endsWith('.jsx')
const extensions = ['.js', '.mjs', '.cjs', '.ts', '.cts', '.mts', '.jsx', '.tsx']

let jiti: ReturnType<typeof createJITI> | undefined

export const bundle = async <T = Config>(filePath: string, cwd: string) => {
  let pathMappings = [] as ReturnType<typeof convertTsPathsToRegexes>
  let baseUrl = ''

  if (!isJs(filePath)) {
    const parsed = await parse(filePath, { root: cwd, resolveWithEmptyIfConfigNotFound: true })
    const options = parsed.tsconfig.compilerOptions
    if (options?.paths) {
      baseUrl = options.baseUrl
      pathMappings = convertTsPathsToRegexes(options?.paths, baseUrl ?? cwd)
    }
  }

  const { deps, aliases } = getConfigDependencies(filePath, { baseUrl, pathMappings })
  logger.debug('bundle', { deps: Array.from(deps), aliases: Object.fromEntries(aliases) })

  let conf
  try {
    jiti =
      jiti ??
      createJITI(cwd, {
        alias: Object.fromEntries(aliases),
        interopDefault: true,
        extensions,
        transform: (opts) => {
          return transform(opts.source, { transforms: ['typescript', 'imports', 'jsx'] })
        },
      })
    conf = jiti(filePath)
  } catch {
    logger.debug('bundle', "Couldn't load config with jiti")
    conf = require(filePath)
  }

  return {
    config: Object.assign({}, conf.default ?? conf) as T, // prevent mutating the original config
    dependencies: Array.from(deps),
  } as BundleConfigResult
}

interface BundleConfigResult {
  config: Config
  dependencies: string[]
}
