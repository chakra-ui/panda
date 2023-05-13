import { logger } from '@pandacss/logger'
import type { Config } from '@pandacss/types'
import type { PandaContext } from './create-context'
import { emitAndExtract } from './extract'
import { loadContext } from './load-context'

async function build(ctx: PandaContext) {
  const msg = await emitAndExtract(ctx)
  logger.info('css:emit', msg)
}

export async function watchFiles(
  config: Config,
  {
    onFileEvent,
    configPath,
  }: { configPath?: string; onFileEvent: (event: string, file: string, ctxRef: PandaContext) => void },
) {
  const [ctxRef, loadCtx] = await loadContext(config, configPath)

  const ctx = ctxRef.current
  await build(ctx)

  const {
    runtime: { fs },
    dependencies,
  } = ctx

  if (ctx.config.watch) {
    const configWatcher = fs.watch({ include: dependencies })
    configWatcher.on('change', async () => {
      logger.info('config:change', 'Config changed, restarting...')
      await loadCtx()
      return build(ctxRef.current)
    })

    const contentWatcher = fs.watch(ctx.config)
    contentWatcher.on('all', async (event, file) => {
      logger.info(`file:${event}`, file)
      onFileEvent(event, file, ctxRef.current)
    })

    logger.info('ctx:watch', ctx.messages.watch())
  }
}
