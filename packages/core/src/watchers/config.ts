import { getConfigDependencies, LoadConfigResult } from '@css-panda/read-config'
import { UserConfig } from '@css-panda/types'
import { createWatcher } from './create-watcher'

export async function configWatcher(conf: LoadConfigResult<UserConfig>) {
  const deps = getConfigDependencies(conf)
  return createWatcher(deps.value, { cwd: deps.cwd })
}
