import { loadConfigFile } from '@css-panda/config'
import { ConfigNotFoundError } from '@css-panda/error'
import { logger } from '@css-panda/logger'
import type { Config } from '@css-panda/types'
import { lookItUpSync } from 'look-it-up'
import { createContext } from './context'

export async function loadConfig(cwd: string, file?: string) {
  const conf = await loadConfigFile({ cwd, file })

  if (!conf.config) {
    throw new ConfigNotFoundError()
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

export async function loadConfigAndCreateContext(options: { cwd?: string; config?: Config } = {}) {
  const { cwd = process.cwd(), config } = options
  const conf = await loadConfig(cwd)
  if (config) {
    Object.assign(conf.config, config)
  }
  return createContext(conf)
}
