import type { LoadConfigResult } from '@css-panda/config'
import { logger } from '@css-panda/logger'
import type { Context } from '../create-context'
import { createWatcher } from './create-watcher'

export async function createConfigWatcher(conf: LoadConfigResult) {
  return createWatcher(conf.dependencies)
}

export async function createContentWatcher(ctx: Context, callback: (file: string) => Promise<void>) {
  const { include, cwd, exclude } = ctx

  const watcher = createWatcher(include, {
    cwd,
    ignore: exclude,
  })

  watcher.on('all', async (event, file) => {
    logger.debug({ type: `file:${event}`, file })

    if (event === 'unlink') {
      ctx.assets.rm(file)
    } else {
      await callback(file)
    }
  })

  return watcher
}

export async function createAssetWatcher(ctx: Context, callback: () => Promise<void>) {
  const { cwd } = ctx
  const watcher = createWatcher(ctx.assets.glob, { cwd })

  watcher.on('all', async (event, file) => {
    logger.debug({ type: `asset:${event}`, file })
    await callback()
  })

  return watcher
}
