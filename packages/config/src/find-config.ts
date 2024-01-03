import findUp from 'escalade/sync'
import { resolve } from 'path'
import type { ConfigFileOptions } from './types'

const configs = ['.ts', '.js', '.mts', '.mjs', '.cts', '.cjs']
const pandaConfigRegex = new RegExp(`panda.config(${configs.join('|')})$`)

const isPandaConfig = (file: string) => pandaConfigRegex.test(file)

export function findConfig({ cwd, file }: Partial<ConfigFileOptions>): string | undefined {
  cwd = cwd ?? process.cwd()
  if (file) return resolve(cwd, file)
  const result = findUp(cwd, (_dir, paths) => paths.find(isPandaConfig))
  return result ?? undefined
}
