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

      result.jsx.forEach((jsx) => {
        jsx.data.forEach((data) => {
          sheet.processStyleProps(data)
        })
      })

      // TODO: result.sva.forEach((sva) => {})

      result.recipe.forEach((recipeSet, name) => {
        try {
          for (const recipe of recipeSet) {
            // TODO: change this to return an array of recipe configs (for slotted recipes)
            const recipeConfig = recipes.getConfig(name)
            if (!recipeConfig) continue

            match(recipe)
              // TODO: treat recipe jsx like regular recipe + atomic
              .with({ type: 'jsx-recipe', name: P.string }, ({ name }) => {
                recipe.data.forEach((data) => {
                  const [recipeProps, styleProps] = recipes.splitProps(name, data)
                  sheet.processStyleProps(styleProps)
                  sheet.processRecipe(recipeConfig, recipeProps)
                })
              })
              .otherwise(() => {
                recipe.data.forEach((data) => {
                  sheet.processRecipe(recipeConfig, data)
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
              .with({ type: 'jsx-pattern', name: P.string }, ({ name }) => {
                pattern.data.forEach((data) => {
                  const fnName = patterns.getFnName(name)
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
        ctx.hooks.callHook('parser:css', result.filePath ?? '', css)
        return css
      },
      (err) => {
        logger.error('serializer:css', 'Failed to serialize CSS: ' + err)
      },
    ),
  )
