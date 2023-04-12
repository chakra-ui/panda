import { logger } from '@pandacss/logger'
import type { Dict, ParserResult } from '@pandacss/types'
import { pipe, tap, tryCatch } from 'lil-fp/func'
import { match, P } from 'ts-pattern'
import type { Context } from '../../engines'

const flattenStyles = (data: Dict) => Object.assign({}, data, { css: undefined }, data.css ?? {}) as Dict

export const generateParserCss = (ctx: Context) => (result: ParserResult) =>
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
          sheet.processAtomic(flattenStyles(data))
        })
      })

      result.recipe.forEach((recipeSet, name) => {
        try {
          for (const recipe of recipeSet) {
            const recipeConfig = recipes.getConfig(name)
            if (!recipeConfig) continue

            match(recipe)
              // treat recipe jsx like regular recipe + atomic
              .with({ type: 'jsx-recipe', name: P.string }, ({ name }) => {
                recipe.data.forEach((data) => {
                  const [recipeProps, styleProps] = recipes.splitProps(name, flattenStyles(data))
                  sheet.processAtomic(styleProps)
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
                  const styleProps = patterns.transform(name, flattenStyles(data))
                  sheet.processAtomic(styleProps)
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
      ({ sheet, result, config: { minify } }) => {
        return !result.isEmpty() ? sheet.toCss({ minify }) : undefined
      },
      () => {
        logger.error('serializer:css', 'Failed to serialize CSS')
      },
    ),
  )
