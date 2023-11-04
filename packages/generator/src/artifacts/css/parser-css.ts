import { logger } from '@pandacss/logger'
import type { Dict, ParserResultType } from '@pandacss/types'
import { P, match } from 'ts-pattern'
import type { Context } from '../../engines'

export const generateParserCss = (ctx: Context, result: ParserResultType) => {
  const { patterns, recipes } = ctx
  const sheet = ctx.createSheet()

  result.css.forEach((css) => {
    css.data.forEach((data) => {
      sheet.processAtomic(data)
    })
  })

  result.cva.forEach((cva) => {
    cva.data.forEach((data) => {
      sheet.processAtomicRecipe(data)
    })
  })

  result.sva.forEach((sva) => {
    sva.data.forEach((data) => {
      sheet.processAtomicSlotRecipe(data)
    })
  })

  result.jsx.forEach((jsx) => {
    jsx.data.forEach((data) => {
      sheet.processStyleProps(filterProps(ctx, data))
    })
  })

  result.recipe.forEach((recipeSet, recipeName) => {
    try {
      for (const recipe of recipeSet) {
        const recipeConfig = recipes.getConfig(recipeName)
        if (!recipeConfig) continue

        match(recipe)
          // treat recipe jsx like regular recipe + atomic
          .with({ type: 'jsx-recipe' }, () => {
            recipe.data.forEach((data) => {
              const [recipeProps, styleProps] = recipes.splitProps(recipeName, data)

              sheet.processStyleProps(filterProps(ctx, styleProps))
              sheet.processRecipe(recipeName, recipeConfig, recipeProps)
            })
          })
          .otherwise(() => {
            recipe.data.forEach((data) => {
              sheet.processRecipe(recipeName, recipeConfig, data)
            })
          })
      }
    } catch (error) {
      logger.error('serializer:recipe', error)
    }
  })

  result.pattern.forEach((patternSet, name) => {
    try {
      for (const pattern of patternSet) {
        match(pattern)
          // treat pattern jsx like regular pattern
          .with({ type: 'jsx-pattern', name: P.string }, ({ name: jsxName }) => {
            pattern.data.forEach((data) => {
              const fnName = patterns.find(jsxName)
              const styleProps = patterns.transform(fnName, data)
              sheet.processStyleProps(filterProps(ctx, styleProps))
            })
          })
          .otherwise(() => {
            pattern.data.forEach((data) => {
              const styleProps = patterns.transform(name, data)
              sheet.processAtomic(styleProps)
            })
          })
      }
    } catch (error) {
      logger.error('serializer:pattern', error)
    }
  })

  try {
    const { minify, optimize } = ctx.config
    const css = !result.isEmpty() ? sheet.toCss({ minify, optimize }) : undefined
    void ctx.hooks.callHook('parser:css', result.filePath ?? '', css)
    return css
  } catch (err) {
    logger.error('serializer:css', 'Failed to serialize CSS: ' + err)
  }
}

const filterProps = (ctx: Context, props: Dict) => {
  const clone = {} as Dict
  for (const [key, value] of Object.entries(props)) {
    if (ctx.isValidProperty(key)) {
      clone[key] = value
    }
  }
  return clone
}
