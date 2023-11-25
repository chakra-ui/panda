import type { Config } from '@pandacss/types'

export const serializeConfig = (config: Config) => {
  return JSON.stringify(config, (_key, value) => {
    if (typeof value === 'function') return value.toString()
    return value
  })
}

export const deserializeConfig = (config: string) => {
  return JSON.parse(config)
}
