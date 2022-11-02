import type { LoadConfigResult } from '@css-panda/config'
import { logger } from '@css-panda/logger'
import chokidar from 'chokidar'
import { join } from 'path'
import type { PandaContext } from './context'

type WatcherOptions = {
  ignore?: string[]
  cwd?: string
  poll?: boolean
}

/* -----------------------------------------------------------------------------
 * Create a watcher for the source files
 * -----------------------------------------------------------------------------*/

export function createWatcher(files: string[], options: WatcherOptions = {}) {
  const { ignore, cwd = process.cwd(), poll } = options
  const coalesce = poll || process.platform === 'win32'

  const watcher = chokidar.watch(files, {
    usePolling: poll,
    cwd,
    ignoreInitial: true,
    ignorePermissionErrors: true,
    ignored: ignore,
    awaitWriteFinish: coalesce ? { stabilityThreshold: 50, pollInterval: 10 } : false,
  })

  logger.debug({
    type: 'file:watcher',
    msg: `watching [${files}]`,
  })

  process.once('SIGINT', async () => {
    await watcher.close()
  })

  return watcher
}

/* -----------------------------------------------------------------------------
 * Watcher for config file
 * -----------------------------------------------------------------------------*/

async function createConfigWatcher(conf: LoadConfigResult) {
  return createWatcher(conf.dependencies)
}

async function createContentWatcher(ctx: PandaContext, callback: (file: string) => Promise<void>) {
  const { include, cwd, exclude } = ctx

  const watcher = createWatcher(include, {
    cwd,
    ignore: exclude,
  })

  watcher.on('all', async (event, file) => {
    logger.debug({ type: `file:${event}`, file })
    ctx.removeSourceFile(file)

    if (event === 'unlink') {
      ctx.assets.rm(file)
    } else {
      ctx.addSourceFile(file)
      await callback(file)
    }
  })

  return watcher
}

/* -----------------------------------------------------------------------------
 * Watcher for asset files
 * -----------------------------------------------------------------------------*/

async function createAssetWatcher(ctx: PandaContext, callback: () => Promise<void>) {
  const { cwd } = ctx
  const watcher = createWatcher([join(ctx.paths.asset, '**/*.css')], { cwd })

  watcher.on('all', async (event, file) => {
    logger.debug({ type: `asset:${event}`, file })
    await callback()
  })

  return watcher
}

/* -----------------------------------------------------------------------------
 * General watcher
 * -----------------------------------------------------------------------------*/

process.setMaxListeners(Infinity)

type Options = {
  onConfigChange: () => Promise<void>
  onContentChange: (file: string) => Promise<void>
  onAssetChange: () => Promise<void>
}

export async function watch(ctx: PandaContext, options: Options) {
  const assetsWatcher = await createAssetWatcher(ctx, options.onAssetChange)
  const contentWatcher = await createContentWatcher(ctx, options.onContentChange)
  const configWatcher = await createConfigWatcher(ctx.conf)

  async function close() {
    await configWatcher.close()
    await assetsWatcher.close()
    await contentWatcher.close()
  }

  configWatcher.on('change', async () => {
    await close()
    logger.info('Config changed, restarting...')
    await options.onConfigChange()
  })
}

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason })
})
process.on('uncaughtException', (err) => {
  logger.error({ err: err })
})
