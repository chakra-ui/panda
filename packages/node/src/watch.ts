import type { LoadConfigResult } from '@pandacss/config'
import { logger } from '@pandacss/logger'
import chokidar from 'chokidar'
import { match } from 'ts-pattern'
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

    match(event)
      .with('unlink', () => {
        ctx.removeSourceFile(file)
        ctx.chunks.rm(file)
      })
      .with('change', async () => {
        ctx.reloadSourceFile(file)
        await callback(file)
      })
      .with('add', async () => {
        ctx.addSourceFile(file)
        await callback(file)
      })
      .otherwise(() => {
        // noop
      })
  })

  return watcher
}

/* -----------------------------------------------------------------------------
 * General watcher
 * -----------------------------------------------------------------------------*/

process.setMaxListeners(Infinity)

type Options = {
  onConfigChange: () => Promise<any>
  onContentChange: (file: string) => Promise<any>
}

export async function watch(ctx: PandaContext, options: Options) {
  // await createAssetWatcher(ctx, options.onAssetChange)
  await createContentWatcher(ctx, options.onContentChange)
  const configWatcher = await createConfigWatcher(ctx.conf)

  configWatcher.on('change', async () => {
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
