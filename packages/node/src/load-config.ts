import { loadConfigFile } from '@css-panda/config'
import { ConfigNotFoundError } from '@css-panda/error'
import { logger } from '@css-panda/logger'
import { lookItUpSync } from 'look-it-up'

export async function loadConfig(cwd: string, file?: string) {
  const conf = await loadConfigFile({ cwd, file })

  if (!conf.config) {
    throw new ConfigNotFoundError({ cwd, path: conf.path })
  }

  logger.debug({ type: 'config:file', path: conf.path })

  return conf
}

const configs = ['.ts', '.js', '.mjs', '.cjs']

export function findConfig() {
  for (const config of configs) {
    const result = lookItUpSync(`panda.config${config}`)
    if (result) {
      return result
    }
  }
}
