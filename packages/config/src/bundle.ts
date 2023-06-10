import { logger } from '@pandacss/logger'
import type { Config } from '@pandacss/types'
import createJITI from 'jiti'
import { createRequire } from 'module'
import { getConfigDependencies } from './get-mod-deps'

const require = createRequire(import.meta.url)

let jiti: ReturnType<typeof createJITI> | undefined
export const bundle = async <T = Config>(filePath: string, cwd: string) => {
  let conf

  try {
    jiti = jiti ?? createJITI(cwd, { esmResolve: true, interopDefault: true })
    conf = jiti(filePath)
  } catch {
    logger.debug('bundle', "Couldn't load config with jiti, trying require: " + filePath)
    conf = require(filePath)
  }

  return {
    config: Object.assign({}, conf.default ?? conf) as T, // prevent mutating the original config
    dependencies: Array.from(getConfigDependencies(filePath)),
  } as BundleConfigResult
}

interface BundleConfigResult {
  config: Config
  dependencies: string[]
}
