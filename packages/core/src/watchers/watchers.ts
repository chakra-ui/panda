import { getConfigDependencies, LoadConfigResult } from '@css-panda/read-config'
import type { UserConfig } from '@css-panda/types'
import type { InternalContext } from '../create-context'
import { createDebug } from '../debug'
import { createWatcher } from './create-watcher'

export async function createConfigWatcher(conf: LoadConfigResult<UserConfig>) {
  const deps = getConfigDependencies(conf)
  return createWatcher(deps.value, { cwd: deps.cwd })
}

export async function createContentWatcher(ctx: InternalContext, callback: (file: string) => void) {
  const { include, cwd, exclude } = ctx

  const watcher = createWatcher(include, { cwd, ignore: exclude })

  watcher.on('update', (file) => {
    createDebug('file:changed', file)
    callback(file)
  })

  watcher.on('create', (file) => {
    createDebug('file:detected', file)
    callback(file)
  })

  watcher.on('delete', (file) => {
    createDebug('📝 file:deleted', file)
    ctx.temp.rm(file)
  })

  return watcher
}

export async function createTempWatcher(ctx: InternalContext, callback: () => Promise<void>) {
  const { cwd } = ctx
  const watcher = createWatcher(ctx.temp.glob, { cwd })

  watcher.on('all', async (event, file) => {
    createDebug(`temp:${event}`, file)
    await callback()
  })

  return watcher
}
