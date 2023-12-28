import { logger } from '@pandacss/logger'
import { resolve } from 'pathe'
import type { PandaContext } from './create-context'
import type { CssArtifactType } from './extract'

const ensureFile = (ctx: PandaContext, cwd: string, file: string) => {
  const outPath = resolve(cwd, file)
  const dirname = ctx.runtime.path.dirname(outPath)
  ctx.runtime.fs.ensureDirSync(dirname)

  return outPath
}

export interface CssGenOptions {
  cwd: string
  outfile?: string
  cssArtifact?: CssArtifactType
  minimal?: boolean
}

export const cssgen = async (ctx: PandaContext, options: CssGenOptions) => {
  const { cwd, outfile, cssArtifact, minimal } = options
  let outPath = ctx.runtime.path.join(...ctx.paths.getFilePath('styles.css'))

  const sheet = ctx.createSheet()
  //
  if (cssArtifact) {
    //
    ctx.appendCss(cssArtifact, sheet)

    if (outfile) {
      outPath = ensureFile(ctx, cwd, outfile)
      const css = ctx.getCss(sheet)
      ctx.runtime.fs.writeFileSync(outfile, css)
    } else {
      await ctx.writeCss(sheet)
    }

    const msg = ctx.messages.cssArtifactComplete(cssArtifact)
    logger.info('css:emit:path', outPath)
    logger.info('css:emit:artifact', msg)
    //
  } else {
    //
    if (!minimal) {
      ctx.appendLayerParams(sheet)
      ctx.appendBaselineCss(sheet)
    }

    const files = ctx.parseFiles()

    if (outfile) {
      outPath = ensureFile(ctx, cwd, outfile)
      const css = ctx.getParserCss(ctx.collectStyles(), outfile)
      ctx.runtime.fs.writeFileSync(outfile, css)
    } else {
      await ctx.writeCss()
    }

    const msg = ctx.messages.buildComplete(files.length)
    logger.info('css:emit:path', outPath)
    logger.info('css:emit:out', msg)
  }
}
