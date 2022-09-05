import { logger } from '@css-panda/logger'
import path from 'path'

function commonSequence(a: string[], b: string[]) {
  const result: string[] = []
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] === b[i]) {
      result.push(a[i])
    } else {
      break
    }
  }
  return result
}

function getCommonDir(paths: string[]) {
  return paths
    .map(path.dirname)
    .map((dir) => dir.split(path.sep))
    .reduce(commonSequence)
    .concat([''])
    .join(path.sep)
}

export function getConfigDependencies(conf: { dependencies: string[] }) {
  const commonDir = getCommonDir(conf.dependencies)
  logger.debug({ type: 'config:deps', commonDir })
  const deps = conf.dependencies.map((file) => file.replace(commonDir, ''))
  return {
    cwd: commonDir,
    value: deps,
  }
}
