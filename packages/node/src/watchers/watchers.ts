import { getConfigDependencies, LoadConfigResult } from '@css-panda/config'
import { logger } from '@css-panda/logger'
import type { UserConfig } from '@css-panda/types'
import type { Context } from '../create-context'
import { createWatcher } from './create-watcher'

export async function createConfigWatcher(conf: LoadConfigResult<UserConfig>) {
  const deps = getConfigDependencies(conf)
  return createWatcher(deps.value, { cwd: deps.cwd })
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
      ctx.temp.rm(file)
    } else {
      await callback(file)
    }
  })

  return watcher
}

export async function createTempWatcher(ctx: Context, callback: () => Promise<void>) {
  const watcher = createWatcher(ctx.temp.glob, {
    cwd: ctx.temp.dir,
  })

  watcher.on('all', async (event, file) => {
    logger.debug(`temp:${event}}`, file)
    await callback()
  })

  return watcher
}
