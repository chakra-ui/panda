import { loadConfigFile } from '@pandacss/config'
import type { Config } from '@pandacss/types'
import { lookItUpSync } from 'look-it-up'
import { createContext } from './create-context'

const configs = ['.ts', '.js', '.mjs', '.cjs']

export function findConfig() {
  for (const config of configs) {
    const result = lookItUpSync(`panda.config${config}`)
    if (result) {
      return result
    }
  }
}

export async function loadConfigAndCreateContext(options: { cwd?: string; config?: Config; configPath?: string } = {}) {
  const { cwd = process.cwd(), config, configPath } = options
  const conf = await loadConfigFile({ cwd, file: configPath })

  if (config) {
    Object.assign(conf.config, config)
  }
  return createContext(conf)
}
