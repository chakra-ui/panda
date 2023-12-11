import { logger } from '@pandacss/logger'
import type { ArtifactId, Config } from '@pandacss/types'
import { match } from 'ts-pattern'
import { PandaContext } from './create-context'
import { emitArtifacts } from './emit-artifact'

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

  ctx.appendAllCss()
  await ctx.writeCss()
  logger.info('css:emit', 'Successfully built the css files ✨')
}

export async function generate(config: Config, configPath?: string) {
  let ctx = await loadConfigAndCreateContext({ config, configPath })
  await build(ctx)

  const {
    runtime: { fs, path },
    config: { cwd },
  } = ctx

  if (ctx.config.watch) {
    const configWatcher = fs.watch({ include: ctx.conf.dependencies })
    configWatcher.on('change', async () => {
      const affecteds = await ctx.diff.reloadConfigAndRefreshContext((conf) => {
        ctx = new PandaContext({ ...conf, hooks: ctx.hooks })
      })
      if (!affecteds.artifacts.size) return

      logger.info('config:change', 'Config changed, restarting...')
      await ctx.hooks.callHook('config:change', ctx.config)
      return build(ctx, Array.from(affecteds.artifacts))
    })

    const contentWatcher = fs.watch(ctx.config)
    contentWatcher.on('all', async (event, file) => {
      logger.info(`file:${event}`, file)
      await match(event)
        .with('unlink', () => {
          ctx.project.removeSourceFile(path.abs(cwd, file))
        })
        .with('change', () => {
          ctx.project.reloadSourceFile(file)
          const result = ctx.project.parseSourceFile(file)
          ctx.appendParserCss(result)
          return ctx.writeCss()
        })
        .with('add', () => {
          ctx.project.createSourceFile(file)
          const result = ctx.project.parseSourceFile(file)
          ctx.appendParserCss(result)
          return ctx.writeCss()
        })
        .otherwise(() => {
          // noop
        })
    })

    logger.info('ctx:watch', ctx.messages.watch())
  }
}
