import { Stylesheet } from '@css-panda/core'
import { NotFoundError } from '@css-panda/error'
import { logger } from '@css-panda/logger'
import { createCollector, createPlugins, transformFile } from '@css-panda/ast'
import path from 'path'
import type { Context } from './create-context'

export async function extractContent(ctx: Context, file: string) {
  const { hash, importMap } = ctx

  const sheet = new Stylesheet(ctx.context(), { hash })
  const collector = createCollector()

  const absPath = path.isAbsolute(file) ? file : path.join(ctx.cwd, file)
  await transformFile(absPath, {
    plugins: createPlugins(collector, importMap, file),
  })

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
      logger.fatal({ err: error })
    }
  })

  collector.pattern.forEach((result, name) => {
    try {
      for (const item of result) {
        const pattern = ctx.patterns[name]
        console.log({ pattern })
        if (!pattern) {
          throw new NotFoundError({ type: 'pattern', name })
        }
        const styleObject = pattern.transform?.(item.data, ctx.helpers) ?? {}
        sheet.processAtomic(styleObject)
      }
    } catch (error) {
      logger.fatal({ err: error })
    }
  })

  if (collector.isEmpty()) return

  const tempPath = ctx.temp.write(file, sheet.toCss())
  logger.debug({ type: 'temp:write', file, tempPath })

  sheet.reset()
}
