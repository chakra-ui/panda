import { logger } from '@pandacss/logger'
import { resolve } from 'pathe'
import type { PandaContext } from './create-context'
import type { CssArtifactType } from './extract'

const ensureFile = (ctx: PandaContext, cwd: string, file: string) => {
  const outPath = resolve(cwd, file)
  const dirname = ctx.runtime.path.dirname(outPath)
  ctx.runtime.fs.ensureDirSync(dirname)
}

export interface CssGenOptions {
  cwd: string
  outfile?: string
  cssArtifact?: CssArtifactType
  minimal?: boolean
}

export const cssgen = async (ctx: PandaContext, options: CssGenOptions) => {
  const { cwd, outfile, cssArtifact, minimal } = options

  const sheet = ctx.createSheet()
  //
  if (cssArtifact) {
    //
    ctx.appendCss(cssArtifact, sheet)

    if (outfile) {
      ensureFile(ctx, cwd, outfile)
      ctx.runtime.fs.writeFileSync(outfile, ctx.getCss())
    } else {
      await ctx.writeCss()
    }

    const msg = ctx.messages.cssArtifactComplete(cssArtifact)
    logger.info('css:emit:artifact', msg)
    //
  } else {
    //
    if (!minimal) {
      ctx.appendLayerParams(sheet)
      ctx.appendBaselineCss(sheet)
    }

    const { files, collect } = ctx.appendFilesCss()

    if (outfile) {
      ensureFile(ctx, cwd, outfile)
      const css = ctx.getParserCss(collect(), outfile)
      ctx.runtime.fs.writeFileSync(outfile, css)
    } else {
      await ctx.writeCss()
    }

    const msg = ctx.messages.buildComplete(files.length)
    logger.info('css:emit:out', msg)
  }
}
