import { logger } from '@pandacss/logger'
import type { Dict, ParserResultType } from '@pandacss/types'
import { P, match } from 'ts-pattern'
import type { Context } from '../../engines'

export const generateParserCss = (ctx: Context, result: ParserResultType) => {
  const { patterns, recipes } = ctx

  result.css.forEach((css) => {
    css.data.forEach((data) => {
      ctx.stylesheet.processAtomic(data)
    })
  })

  result.cva.forEach((cva) => {
    cva.data.forEach((data) => {
      ctx.stylesheet.processAtomicRecipe(data)
    })
  })

  result.sva.forEach((sva) => {
    sva.data.forEach((data) => {
      ctx.stylesheet.processAtomicSlotRecipe(data)
    })
  })

  result.jsx.forEach((jsx) => {
    jsx.data.forEach((data) => {
      ctx.stylesheet.processStyleProps(filterProps(ctx, data))
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

              ctx.stylesheet.processStyleProps(filterProps(ctx, styleProps))
              ctx.stylesheet.processRecipe(recipeName, recipeConfig, recipeProps)
            })
          })
          .otherwise(() => {
            recipe.data.forEach((data) => {
              ctx.stylesheet.processRecipe(recipeName, recipeConfig, data)
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
              ctx.stylesheet.processStyleProps(filterProps(ctx, styleProps))
            })
          })
          .otherwise(() => {
            pattern.data.forEach((data) => {
              const styleProps = patterns.transform(name, data)
              ctx.stylesheet.processAtomic(styleProps)
            })
          })
      }
    } catch (error) {
      logger.error('serializer:pattern', error)
    }
  })

  void ctx.hooks.callHook('parser:css', result.filePath ?? '', '')
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
