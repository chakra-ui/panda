import findUp from 'escalade/sync'
import { resolve } from 'path'

const configs = ['.ts', '.js', '.mts', '.mjs', '.cts', '.cjs']
const pandaConfigRegex = new RegExp(`panda.config(${configs.join('|')})$`)

const isPandaConfig = (file: string) => pandaConfigRegex.test(file)

export function findConfigFile({ cwd, file }: { cwd: string; file?: string }) {
  if (file) return resolve(cwd, file)
  return findUp(cwd, (_dir, paths) => {
    return paths.find(isPandaConfig)
  })
}
