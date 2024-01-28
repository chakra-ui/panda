import { PandaError } from '@pandacss/shared'
import findUp from 'escalade/sync'
import { resolve } from 'path'
import type { ConfigFileOptions } from './types'

const configs = ['.ts', '.js', '.mts', '.mjs', '.cts', '.cjs']
const pandaConfigRegex = new RegExp(`panda.config(${configs.join('|')})$`)

const isPandaConfig = (file: string) => pandaConfigRegex.test(file)

export function findConfig(options: Partial<ConfigFileOptions>): string {
  const { cwd = process.cwd(), file } = options

  if (file) {
    return resolve(cwd, file)
  }

  const configPath = findUp(cwd, (_dir, paths) => paths.find(isPandaConfig))

  if (!configPath) {
    throw new PandaError(
      'CONFIG_NOT_FOUND',
      `Cannot find config file \`panda.config.{ts,js,mjs,mts}\`. Did you forget to run \`panda init\`?`,
    )
  }

  return configPath
}
