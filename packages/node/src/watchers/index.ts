import { logger } from '@css-panda/logger'
import type { Context } from '../create-context'
import { createAssetWatcher, createConfigWatcher, createContentWatcher } from './watchers'

process.setMaxListeners(Infinity)

type Options = {
  onConfigChange: () => Promise<void>
  onContentChange: (file: string) => Promise<void>
  onAssetChange: () => Promise<void>
}

export async function watch(ctx: Context, options: Options) {
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
    logger.info('⚙️ Config updated, restarting...')
    await options.onConfigChange()
  })
}

process.on('unhandledRejection', (reason) => {
  logger.error(reason)
})
process.on('uncaughtException', (err) => {
  logger.error(err)
})
