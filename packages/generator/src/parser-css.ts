import { logger } from '@pandacss/logger'
import type { ParserResult } from '@pandacss/types'
import { match, P } from 'ts-pattern'
import type { Context } from './engines'

export const getParserCss = (ctx: Context, result: ParserResult) => {
  const {
    createSheet,
    patterns,
    recipes,
    config: { minify },
  } = ctx

  const sheet = createSheet()

  result.css.forEach((css) => {
    sheet.processAtomic(css.data)
  })

  result.cva.forEach((cva) => {
    sheet.processAtomicRecipe(cva.data)
  })

  result.jsx.forEach((jsx) => {
    const { css = {}, ...rest } = jsx.data
    const styles = { ...rest, ...css }

    match(jsx)
      // treat pattern jsx like regular pattern
      .with({ type: 'pattern', name: P.string }, ({ name }) => {
        result.setPattern(patterns.getFnName(name), { data: styles })
      })
      // treat recipe jsx like regular recipe + atomic
      .with({ type: 'recipe', name: P.string }, ({ name }) => {
        const [recipeProps, styleProps] = recipes.splitProps(name, styles)
        result.setRecipe(recipes.getFnName(name), { data: recipeProps })
        sheet.processAtomic(styleProps)
      })
      // read and process style props
      .otherwise(() => {
        sheet.processAtomic(styles)
      })
  })

  result.recipe.forEach((recipeSet, name) => {
    try {
      for (const recipe of recipeSet) {
        const recipeConfig = recipes.getConfig(name)
        if (!recipeConfig) continue
        sheet.processRecipe(recipeConfig, recipe.data)
      }
    } catch (error) {
      logger.error('serializer:recipe', error)
    }
  })

  result.pattern.forEach((patternSet, name) => {
    try {
      for (const pattern of patternSet) {
        const styleProps = patterns.transform(name, pattern.data)
        sheet.processAtomic(styleProps)
      }
    } catch (error) {
      logger.error('serializer:pattern', error)
    }
  })

  if (result.isEmpty()) {
    return
  }

  return sheet.toCss({ minify })
}
