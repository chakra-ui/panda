import { Stylesheet } from '@css-panda/atomic'
import { logger } from '@css-panda/logger'
import { createCollector, createPlugins, transformFileSync } from '@css-panda/parser'
import path from 'path'
import type { Context } from './create-context'

export function extractContent(ctx: Context, file: string) {
  const { hash, importMap } = ctx

  const sheet = new Stylesheet(ctx.context(), { hash })
  const collector = createCollector()

  const absPath = path.join(ctx.cwd, file)
  transformFileSync(absPath, {
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
    for (const item of result) {
      sheet.processRecipe(ctx.recipes[name], item.data)
    }
  })

  collector.pattern.forEach((result, name) => {
    for (const item of result) {
      sheet.processPattern(ctx.patterns[name], item.data)
    }
  })

  if (collector.isEmpty()) return

  const tempPath = ctx.temp.write(file, sheet.toCss())
  logger.debug({ type: 'temp:write', tempPath })

  sheet.reset()
}
