import { logger } from '@pandacss/logger'
import type { Config } from '@pandacss/types'
import { match } from 'ts-pattern'
import type { PandaContext } from './create-context'
import { bundleChunks, emitAndExtract, writeFileChunk } from './extract'
import { loadContext } from './load-context'

async function build(ctx: PandaContext) {
  const msg = await emitAndExtract(ctx)
  logger.info('css:emit', msg)
}

export async function generate(config: Config, configPath?: string) {
  const [ctxRef, loadCtx] = await loadContext(config, configPath)

  const ctx = ctxRef.current
  await build(ctx)

  const {
    runtime: { fs, path },
    dependencies,
    config: { cwd },
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
      match(event)
        .with('unlink', () => {
          ctx.project.removeSourceFile(path.abs(cwd, file))
          ctx.chunks.rm(file)
        })
        .with('change', async () => {
          ctx.project.reloadSourceFile(file)
          await writeFileChunk(ctxRef.current, file)
          return bundleChunks(ctxRef.current)
        })
        .with('add', async () => {
          ctx.project.createSourceFile(file)
          return bundleChunks(ctxRef.current)
        })
        .otherwise(() => {
          // noop
        })
    })

    logger.info('ctx:watch', ctx.messages.watch())
  }
}
