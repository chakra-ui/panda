import { logger } from '@pandacss/logger'
import type { Config, DiffConfigResult } from '@pandacss/types'
import { codegen } from './codegen'
import { loadConfigAndCreateContext } from './config'
import { PandaContext } from './create-context'

async function build(ctx: PandaContext, changes?: DiffConfigResult) {
  await codegen(ctx, changes)

  if (ctx.config.emitTokensOnly) {
    return logger.info('css:emit', 'Successfully rebuilt the css variables and js function to query your tokens ✨')
  }

  const done = logger.time.info('')

  const sheet = ctx.createSheet()
  ctx.appendLayerParams(sheet)
  ctx.appendBaselineCss(sheet)
  const parsed = ctx.parseFiles()
  ctx.appendParserCss(sheet)

  await ctx.writeCss(sheet)
  done(ctx.messages.buildComplete(parsed.files.length))
}

export async function generate(config: Config, configPath?: string) {
  let ctx = await loadConfigAndCreateContext({ config, configPath })
  await build(ctx)

  const { cwd, watch, poll } = ctx.config

  if (watch) {
    //
    ctx.watchConfig(
      async () => {
        const changes = await ctx.diff.reloadConfigAndRefreshContext((conf) => {
          ctx = new PandaContext(conf)
        })

        logger.info('ctx:updated', 'config rebuilt ✅')
        await ctx.hooks['config:change']?.({ config: ctx.config, changes: changes })
        return build(ctx, changes)
      },
      { cwd, poll },
    )

    const bundleStyles = async (ctx: PandaContext, changedFilePath: string) => {
      const outfile = ctx.runtime.path.join(...ctx.paths.root, 'styles.css')
      const parserResult = ctx.project.parseSourceFile(changedFilePath)

      if (parserResult) {
        const done = logger.time.info(ctx.messages.buildComplete(1))
        const sheet = ctx.createSheet()
        ctx.appendLayerParams(sheet)
        ctx.appendBaselineCss(sheet)
        ctx.appendParserCss(sheet)
        const css = ctx.getCss(sheet)
        await ctx.runtime.fs.writeFile(outfile, css)
        done()
      }
    }

    ctx.watchFiles(async (event, file) => {
      const filePath = ctx.runtime.path.abs(cwd, file)
      if (event === 'unlink') {
        ctx.project.removeSourceFile(filePath)
      } else if (event === 'change') {
        ctx.project.reloadSourceFile(file)
        await bundleStyles(ctx, filePath)
      } else if (event === 'add') {
        ctx.project.createSourceFile(file)
        await bundleStyles(ctx, filePath)
      }
    })
  }
}
