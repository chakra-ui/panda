import type { Collector } from '@pandacss/parser'
import { logger, quote } from '@pandacss/logger'
import type { PandaContext } from './context'

export function extractFile(ctx: PandaContext, file: string) {
  logger.debug({ type: 'file:extract', file })

  let data: Collector | undefined
  let result: { css: string; file: string } | undefined

  const done = logger.time.debug('Extracted', quote(file))

  try {
    const source = ctx.getSourceFile(file)
    data = ctx.parseSourceFile(source)
  } catch (error) {
    logger.error({ err: error })
  }

  if (data) {
    result = ctx.getCss(data, file)
  }

  if (result) {
    done()
  }

  return result
}

export function extractFiles(ctx: PandaContext) {
  return ctx.extract(async (file) => {
    const result = extractFile(ctx, file)
    if (result) {
      await ctx.chunks.write(file, result.css)
      return result
    }
  })
}

export function extractGlobalCss(ctx: PandaContext) {
  const css = ctx.getGlobalCss()
  if (!css) return
  return ctx.chunks.write('globals.css', css)
}
