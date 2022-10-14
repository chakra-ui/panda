import findUp from 'escalade/sync'
import { resolve } from 'path'

const configs = ['.ts', '.js', '.mjs', '.cjs']

export function findConfigFile({ cwd, file }: { cwd: string; file?: string }) {
  if (file) return resolve(cwd, file)
  return findUp(cwd, (_dir, paths) => {
    const regex = new RegExp(`panda.config(${configs.join('|')})$`)
    return paths.find((p) => regex.test(p))
  })
}
