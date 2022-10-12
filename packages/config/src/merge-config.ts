import { logger } from '@css-panda/logger'
import type { Config } from '@css-panda/types'
import { realpathSync } from 'fs'
import { isAbsolute, resolve } from 'path'

export async function mergePresets(baseConfig: Config, fn: (a: Config, b: Config) => void) {
  const cwd = process.cwd()

  if (!baseConfig.extends) return

  for (const preset of baseConfig.extends) {
    const fileName = isAbsolute(preset) ? preset : resolve(cwd, preset)

    try {
      const realFileName = realpathSync(fileName)
      delete require.cache[fileName]

      const raw = require(realFileName)
      const config = raw.__esModule ? raw.default : raw

      if (config) {
        fn(baseConfig, config)
      }

      delete baseConfig.extends
    } catch (error) {
      logger.error({ err: error })
    }
  }
}
