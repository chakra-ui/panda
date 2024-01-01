import { logger } from '@pandacss/logger'
import type { ArtifactId, Config } from '@pandacss/types'
import { match } from 'ts-pattern'
import { loadConfigAndCreateContext } from './config'
import { PandaContext } from './create-context'
import { codegen } from './codegen'

async function build(ctx: PandaContext, artifactIds?: ArtifactId[]) {
  await codegen(ctx, artifactIds)

  if (ctx.config.emitTokensOnly) {
    return logger.info('css:emit', 'Successfully rebuilt the css variables and js function to query your tokens ✨')
  }

  const sheet = ctx.createSheet()
  ctx.appendLayerParams(sheet)
  ctx.appendBaselineCss(sheet)
  ctx.parseFiles()
  ctx.appendParserCss(sheet)

  await ctx.writeCss(sheet)
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

      if (!affecteds.hasConfigChanged) {
        logger.debug('builder', 'Config didnt change, skipping rebuild')
        return
      }

      logger.info('config:change', 'Config changed, restarting...')
      await ctx.hooks.callHook('config:change', ctx.config)
      return build(ctx, Array.from(affecteds.artifacts))
    })

    const contentWatcher = fs.watch(ctx.config)

    const bundleStyles = async (ctx: PandaContext, changedFilePath: string) => {
      const outfile = ctx.runtime.path.join(...ctx.paths.root, 'styles.css')
      const parserResult = ctx.project.parseSourceFile(changedFilePath)

      if (parserResult) {
        const sheet = ctx.createSheet()
        ctx.appendLayerParams(sheet)
        ctx.appendBaselineCss(sheet)
        ctx.appendParserCss(sheet)
        const css = ctx.getCss(sheet)
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
