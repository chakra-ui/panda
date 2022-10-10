import { createCollector, createPlugins, parseFile } from '@css-panda/ast'
import { logger, quote } from '@css-panda/logger'
import type { PandaContext } from './context'

export async function extractFile(ctx: PandaContext, file: string) {
  logger.debug({ type: 'file:extract', file })

  const data = createCollector()

  const done = logger.time.debug('Extracted', quote(file))

  try {
    const plugins = createPlugins(data, {
      importMap: ctx.importMap,
      fileName: file,
      jsx: {
        factory: ctx.jsxFactory,
        isStyleProp: ctx.isProperty,
        nodes: ctx.patternNodes,
      },
    })
    await parseFile(file, plugins)
  } catch (error) {
    logger.error({ err: error })
  }

  const result = ctx.collectStyles(data, file)

  if (result) {
    done()
  }

  return result
}

export function extractFiles(ctx: PandaContext) {
  return ctx.extract(async (file) => {
    const result = await extractFile(ctx, file)
    if (result) {
      await ctx.assets.write(file, result.css)
      return result
    }
  })
}
