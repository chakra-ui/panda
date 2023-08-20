import { logger } from '@pandacss/logger'
import type { ParserResultType } from '@pandacss/types'
import { pipe, tap, tryCatch } from 'lil-fp/func'
import { P, match } from 'ts-pattern'
import type { Context } from '../../engines'

export const generateParserCss = (ctx: Context) => (result: ParserResultType) =>
  pipe(
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
                  sheet.processStyleProps(styleProps)
                  sheet.processRecipe(recipeName, recipeConfig, recipeProps)
                })
              })
              .otherwise(() => {
                recipe.data.forEach((data) => {
                  const { css, ...recipeProps } = data ?? {}
                  sheet.processRecipe(recipeName, recipeConfig, recipeProps)

                  if (css) {
                    sheet.processStyleProps({ css })
                  }
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
                  const styleProps = patterns.transform(fnName, data)
                  sheet.processStyleProps(styleProps)
                })
              })
              .otherwise(() => {
                pattern.data.forEach((data) => {
                  const { css, ...patternProps } = data ?? {}
                  const styleProps = patterns.transform(name, data)
                  sheet.processAtomic(styleProps)

                  if (css) {
                    sheet.processStyleProps(patternProps)
                  }
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
        ctx.hooks.callHook('parser:css', result.filePath ?? '', css)
        return css
      },
      (err) => {
        logger.error('serializer:css', 'Failed to serialize CSS: ' + err)
      },
    ),
  )
