import { logger } from '@pandacss/logger'
import type { Config } from '@pandacss/types'
import { match } from 'ts-pattern'
import type { PandaContext } from './create-context'
import { emitArtfifactsAndCssChunks } from './extract'

import { loadConfigAndCreateContext } from './config'

export async function generate(config: Config, configPath?: string) {
  const ctx = await loadConfigAndCreateContext({ config, configPath })
  await emitArtfifactsAndCssChunks(ctx)

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
      return emitArtfifactsAndCssChunks(ctx, Array.from(affecteds.artifacts))
    })

    const contentWatcher = fs.watch(ctx.config)

    const bundleStyles = async (ctx: PandaContext, changedFilePath: string) => {
      const outfile = ctx.runtime.path.join(...ctx.paths.root, 'styles.css')
      const parserResult = ctx.project.parseSourceFile(changedFilePath)

      if (parserResult) {
        const css = ctx.getCss({ resolve: false })
        await ctx.runtime.fs.writeFile(outfile, css)
        return { msg: ctx.messages.buildComplete(1) }
      }
    }

    contentWatcher.on('all', async (event, file) => {
      logger.info(`file:${event}`, file)

      const filePath = path.abs(cwd, file)

      match(event)
        .with('unlink', () => {
          ctx.project.removeSourceFile(path.abs(cwd, file))
        })
        .with('change', async () => {
          ctx.project.reloadSourceFile(file)
          return bundleStyles(ctx, filePath)
        })
        .with('add', async () => {
          ctx.project.createSourceFile(file)
          return bundleStyles(ctx, filePath)
        })
        .otherwise(() => {
          // noop
        })
    })

    logger.info('ctx:watch', ctx.messages.watch())
  }
}
