import { logger } from '@pandacss/logger'
import type { ArtifactId, Config } from '@pandacss/types'
import { match } from 'ts-pattern'
import type { PandaContext } from './create-context'
import { bundleStyleChunksWithImports, emitArtifacts, writeAndBundleCssChunks, writeFileChunk } from './extract'

import { loadConfigAndCreateContext } from './config'

/**
 * 1. Emit artifacts
 * 2. Writes all the css chunks in outdir/chunks/{file}.css
 * 3. Bundles them in outdir/styles.css
 */
async function build(ctx: PandaContext, ids?: ArtifactId[]) {
  await emitArtifacts(ctx, ids)
  if (ctx.config.emitTokensOnly) {
    return logger.info('css:emit', 'Successfully rebuilt the css variables and js function to query your tokens ✨')
  }

  const { msg } = await writeAndBundleCssChunks(ctx)
  logger.info('css:emit', msg)
}

export async function generate(config: Config, configPath?: string) {
  const ctx = await loadConfigAndCreateContext({ config, configPath })
  await build(ctx)

  const {
    runtime: { fs, path },
    config: { cwd },
  } = ctx

  if (ctx.config.watch) {
    const configWatcher = fs.watch({ include: ctx.conf.dependencies })
    configWatcher.on('change', async () => {
      const affecteds = await ctx.diff.reloadConfigAndRefreshContext()
      if (!affecteds.artifacts.size) return

      logger.info('config:change', 'Config changed, restarting...')
      await ctx.hooks.callHook('config:change', ctx.config)
      return build(ctx, Array.from(affecteds.artifacts))
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
          await writeFileChunk(ctx, file)
          return bundleStyleChunksWithImports(ctx)
        })
        .with('add', async () => {
          ctx.project.createSourceFile(file)
          return bundleStyleChunksWithImports(ctx)
        })
        .otherwise(() => {
          // noop
        })
    })

    logger.info('ctx:watch', ctx.messages.watch())
  }
}
