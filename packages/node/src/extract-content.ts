import { createCollector, createPlugins, transformFile } from '@css-panda/ast'
import { Stylesheet } from '@css-panda/core'
import { NotFoundError } from '@css-panda/error'
import { logger, quote } from '@css-panda/logger'
import path from 'path'
import type { Context } from './create-context'

export async function extractContent(ctx: Context, file: string) {
  const { hash, importMap } = ctx

  logger.debug({ type: 'file:extract', file })

  const sheet = new Stylesheet(ctx.context(), { hash })
  const collector = createCollector()

  const absPath = path.isAbsolute(file) ? file : path.join(ctx.cwd, file)

  const markEnd = logger.time('Extracted', quote(file))

  try {
    await transformFile(absPath, {
      plugins: createPlugins(collector, importMap, file),
    })
  } catch (error) {
    logger.error({ err: error })
  }

  collector.globalStyle.forEach((result) => {
    sheet.processObject(result.data)
  })

  collector.fontFace.forEach((result) => {
    sheet.processFontFace(result)
  })

  collector.css.forEach((result) => {
    sheet.process(result)
  })

  collector.cssMap.forEach((result) => {
    for (const data of Object.values(result.data)) {
      sheet.process({ type: 'object', data })
    }
  })

  collector.recipe.forEach((result, name) => {
    try {
      for (const item of result) {
        const recipe = ctx.recipes[name]
        if (!recipe) {
          throw new NotFoundError({ type: 'recipe', name })
        }
        sheet.processRecipe(recipe, item.data)
      }
    } catch (error: any) {
      logger.error({ err: error })
    }
  })

  collector.pattern.forEach((result, name) => {
    try {
      for (const item of result) {
        const pattern = ctx.patterns[name]
        if (!pattern) {
          throw new NotFoundError({ type: 'pattern', name })
        }
        const styleObject = pattern.transform?.(item.data, ctx.helpers) ?? {}
        sheet.processAtomic(styleObject)
      }
    } catch (error) {
      logger.error({ err: error })
    }
  })

  markEnd()

  if (collector.isEmpty()) return ''

  return sheet.toCss()
}
