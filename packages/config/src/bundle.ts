import type { Config } from '@pandacss/types'
import createJITI from 'jiti'
import { getConfigDependencies } from './get-mod-deps'

export const bundle = async <T = Config>(filePath: string, cwd: string) => {
  const jiti = createJITI(cwd, { cache: false, requireCache: false, v8cache: false })
  const conf = jiti(filePath)

  return {
    config: (conf.default ? conf.default : conf) as T,
    dependencies: Array.from(getConfigDependencies(filePath)),
  } as BundleConfigResult
}

interface BundleConfigResult {
  config: Config
  dependencies: string[]
}
