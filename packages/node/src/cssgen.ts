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
  const { cwd, outfile, type, minimal } = options
  let outPath = ctx.runtime.path.join(...ctx.paths.getFilePath('styles.css'))

  const sheet = ctx.createSheet()
  //
  if (type) {
    //
    ctx.appendCssOfType(type, sheet)

    if (outfile) {
      outPath = ctx.output.ensure(outfile, cwd)
      const css = ctx.getCss(sheet)
      ctx.runtime.fs.writeFileSync(outfile, css)
    } else {
      await ctx.writeCss(sheet)
    }

    const msg = ctx.messages.cssArtifactComplete(type)
    logger.info('css:emit:path', outPath)
    logger.info('css:emit:artifact', msg)
    //
  } else {
    //
    if (!minimal) {
      ctx.appendLayerParams(sheet)
      ctx.appendBaselineCss(sheet)
    }

    const { files } = ctx.parseFiles()
    ctx.appendParserCss(sheet)

    if (outfile) {
      //
      outPath = ctx.output.ensure(outfile, cwd)

      const css = ctx.getCss(sheet)
      ctx.runtime.fs.writeFileSync(outfile, css)
      //
    } else {
      //
      await ctx.writeCss(sheet)
    }

    const msg = ctx.messages.buildComplete(files.length)
    logger.info('css:emit:path', outPath)
    logger.info('css:emit:out', msg)
  }
}
