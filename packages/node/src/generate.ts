import { logger } from '@pandacss/logger'
import type { Config } from '@pandacss/types'
import { match } from 'ts-pattern'
import type { PandaContext } from './create-context'
import { bundleStyleChunksWithImports, emitArtfifactsAndCssChunks, writeFileChunk } from './extract'
import { loadContext } from './load-context'
import { createParserResult } from '@pandacss/parser'

async function build(ctx: PandaContext) {
  const { msg } = await emitArtfifactsAndCssChunks(ctx)
  logger.info('css:emit', msg)
}

export async function generate(config: Config, configPath?: string) {
  const [ctxRef, loadCtx] = await loadContext(config, configPath)

  const ctx = ctxRef.current
  await build(ctx)
  // const collector = createParserResult(ctx.parserOptions)
  // ctx.project.parserResults.forEach((result) => {
  //   collector.mergeStyles(result)
  // })

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
      await ctxRef.current.hooks.callHook('config:change', ctxRef.current.config)
      return build(ctxRef.current)
    })

    const contentWatcher = fs.watch(ctx.config)
    const collector = createParserResult(ctx.parserOptions)
    ctx.project.parserResults.forEach((result) => {
      collector.mergeStyles(result)
    })

    const bundleStyles = async (ctx: PandaContext, changedFilePath: string) => {
      const outfile = ctx.runtime.path.join(...ctx.paths.root, 'styles.css')
      const parserResult = ctx.project.parseSourceFile(changedFilePath)

      if (parserResult) {
        collector.mergeStyles(parserResult)
      }
      const styles = ctx.getParserCss(collector) ?? ''

      const css = ctx.getCss({ files: [styles], resolve: false })
      await ctx.runtime.fs.writeFile(outfile, css)
      return { msg: ctx.messages.buildComplete(ctx.project.parserResults.size) }
    }

    contentWatcher.on('all', async (event, file) => {
      logger.info(`file:${event}`, file)

      const filePath = path.abs(cwd, file)

      match(event)
        .with('unlink', () => {
          ctx.project.removeSourceFile(path.abs(cwd, file))
        })
        .with('change', async () => {
          // console.log({ change: file, parserResults: ctx.project.parserResults.size })

          ctx.project.reloadSourceFile(file)
          ctx.project.parserResults.delete(filePath)
          return bundleStyles(ctxRef.current, filePath)
        })
        .with('add', async () => {
          ctx.project.createSourceFile(file)
          return bundleStyles(ctxRef.current, filePath)
        })
        .otherwise(() => {
          // noop
        })
    })

    logger.info('ctx:watch', ctx.messages.watch())
  }
}
