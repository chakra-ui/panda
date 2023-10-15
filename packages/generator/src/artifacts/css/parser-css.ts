import { logger } from '@pandacss/logger'
import type { ParserResultType } from '@pandacss/types'
import { pipe, tap, tryCatch } from 'lil-fp/func'
import { P, match } from 'ts-pattern'
import type { Context } from '../../engines'

export const generateParserCss = (ctx: Context) => (parserResult: ParserResultType) => {
  const filePath = parserResult.filePath ?? ''
  const collector = parserResult.collectStyles()
  if (!collector) return ''

  // console.time('generateParserCss')
  const sheet = ctx.createSheet()
  const { minify, optimize } = ctx.config

  collector.atomic.forEach((css) => {
    sheet.processAtomic(css.result)
  })

  // TODO directly pass the layer root ?
  const recipeLayer = { layer: 'recipes' }
  collector.recipes.forEach((recipeSet) => {
    recipeSet.forEach((recipe) => {
      sheet.processAtomic(recipe.result, recipeLayer)
    })
  })

  const recipeBaseLayer = { layer: 'recipes_base' }
  collector.recipes_base.forEach((recipeSet) => {
    recipeSet.forEach((recipe) => {
      sheet.processAtomic(recipe.result, recipeBaseLayer)
    })
  })

  // TODO pattern ?
  // console.timeEnd('generateParserCss')

  try {
    // console.time('sheet.toCss')
    const css = sheet.toCss({ minify, optimize })
    // console.timeEnd('sheet.toCss')
    ctx.hooks.callHook('parser:css', filePath, css)
    return css
  } catch (err) {
    logger.error('serializer:css', 'Failed to serialize CSS: ' + err)
    return ''
  }
}

export const generateParserCssOld = (ctx: Context) => (result: ParserResultType) => {
  if (result.isEmpty()) return

  return pipe(
    { ...ctx, sheet: ctx.createSheet(), result },

    tap(({ sheet, result, patterns, recipes }) => {
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
          sheet.processStyleProps(data)
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

                  // TODO skip base if seen already
                  sheet.processStyleProps(styleProps)
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
                  const fnName = patterns.getFnName(jsxName)
                  // TODO skip base if seen already
                  const styleProps = patterns.transform(fnName, data)
                  sheet.processStyleProps(styleProps)
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
    }),

    tryCatch(
      ({ sheet, result, config: { minify, optimize } }) => {
        const css = !result.isEmpty() ? sheet.toCss({ minify, optimize }) : undefined
        void ctx.hooks.callHook('parser:css', result.filePath ?? '', css)
        return css
      },
      (err) => {
        logger.error('serializer:css', 'Failed to serialize CSS: ' + err)
      },
    ),
  )
}
