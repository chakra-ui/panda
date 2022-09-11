import { loadConfigFile } from '@css-panda/config'
import { ConfigNotFoundError } from '@css-panda/error'
import { logger } from '@css-panda/logger'
import { existsSync } from 'fs-extra'
import { join } from 'path'

export async function loadConfig(cwd: string, file?: string) {
  const conf = await loadConfigFile({ cwd, file })

  if (!conf.config) {
    throw new ConfigNotFoundError({ cwd, path: conf.path })
  }

  logger.debug({ type: 'config:file', path: conf.path })

  return conf
}

const configs = ['.ts', '.js', '.mjs', '.cjs']

export function findConfig(cwd: string) {
  return configs.find((config) => {
    return existsSync(join(cwd, `panda.config${config}`))
  })
}
