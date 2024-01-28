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
    const done = ctx.logger.time.info(ctx.messages.cssArtifactComplete(type))

    ctx.appendCssOfType(type, sheet)

    if (outfile) {
      const css = ctx.getCss(sheet)
      ctx.runtime.fs.writeFileSync(outfile, css)
    } else {
      await ctx.writeCss(sheet)
    }

    done()
  } else {
    const { files } = ctx.parseFiles()

    const done = ctx.logger.time.info(ctx.messages.buildComplete(files.length))
    if (!minimal) {
      ctx.appendLayerParams(sheet)
      ctx.appendBaselineCss(sheet)
    }

    ctx.appendParserCss(sheet)

    if (outfile) {
      const css = ctx.getCss(sheet)
      ctx.runtime.fs.writeFileSync(outfile, css)
    } else {
      await ctx.writeCss(sheet)
    }

    done()
  }
}
