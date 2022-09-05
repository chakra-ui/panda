import { logger } from '@css-panda/logger'
import { getConfigDependencies, LoadConfigResult } from '@css-panda/read-config'
import type { UserConfig } from '@css-panda/types'
import type { Context } from '../create-context'
import { createWatcher } from './create-watcher'

export async function createConfigWatcher(conf: LoadConfigResult<UserConfig>) {
  const deps = getConfigDependencies(conf)
  return createWatcher(deps.value, { cwd: deps.cwd })
}

export async function createContentWatcher(ctx: Context, callback: (file: string) => void) {
  const { include, cwd, exclude } = ctx

  const watcher = createWatcher(include, {
    cwd,
    ignore: exclude,
  })

  watcher.on('update', (file) => {
    logger.debug('file:changed', file)
    callback(file)
  })

  watcher.on('create', (file) => {
    logger.debug('file:detected', file)
    callback(file)
  })

  watcher.on('delete', (file) => {
    logger.debug('file:deleted', file)
    ctx.temp.rm(file)
  })

  return watcher
}

export async function createTempWatcher(ctx: Context, callback: () => Promise<void>) {
  const watcher = createWatcher(ctx.temp.glob, {
    cwd: ctx.temp.dir,
  })

  watcher.on('update', async (file) => {
    logger.debug(`temp:update`, file)
    await callback()
  })

  watcher.on('create', async (file) => {
    logger.debug(`temp:create`, file)
    await callback()
  })

  watcher.on('delete', async (file) => {
    logger.debug(`temp:delete`, file)
    await callback()
  })

  await callback()

  return watcher
}
