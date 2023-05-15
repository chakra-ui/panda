import type { Config } from '@pandacss/types'
import { bundleNRequire } from 'bundle-n-require'

export async function bundle<T = Config>(filePath: string, cwd: string) {
  const { mod: config, dependencies } = await bundleNRequire(filePath, { cwd })
  return { config: config as T, dependencies }
}
