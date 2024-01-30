import { logger } from '@pandacss/logger'
import type { CssArtifactType } from '@pandacss/types'
import type { PandaContext } from './create-context'

export interface CssGenOptions {
  cwd: string
  outfile?: string
  type?: CssArtifactType
  minimal?: boolean
}

export const cssgen = async (ctx: PandaContext, options: CssGenOptions) => {
  const { outfile, type, minimal } = options

  const sheet = ctx.createSheet()

  if (type) {
    const done = logger.time.info(ctx.messages.cssArtifactComplete(type))

    ctx.appendCssOfType(type, sheet)

    if (outfile) {
      const css = ctx.getCss(sheet)
      logger.info('css', ctx.runtime.path.resolve(outfile))
      await ctx.runtime.fs.writeFile(outfile, css)
    } else {
      await ctx.writeCss(sheet)
    }

    done()
  } else {
    const { files } = ctx.parseFiles()

    const done = logger.time.info(ctx.messages.buildComplete(files.length))
    if (!minimal) {
      ctx.appendLayerParams(sheet)
      ctx.appendBaselineCss(sheet)
    }

    ctx.appendParserCss(sheet)

    if (outfile) {
      const css = ctx.getCss(sheet)
      logger.info('css', ctx.runtime.path.resolve(outfile))
      await ctx.runtime.fs.writeFile(outfile, css)
    } else {
      await ctx.writeCss(sheet)
    }

    done()
  }
}
