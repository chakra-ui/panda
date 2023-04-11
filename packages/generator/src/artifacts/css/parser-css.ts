import { logger } from '@pandacss/logger'
import type { ParserResult } from '@pandacss/types'
import { pipe, tap, tryCatch } from 'lil-fp/func'
import { match, P } from 'ts-pattern'
import type { Context } from '../../engines'

export const generateParserCss = (ctx: Context) => (result: ParserResult) =>
  pipe(
    { ...ctx, sheet: ctx.createSheet(), result },
    tap(({ sheet, result, patterns, recipes }) => {
      result.css.forEach((css) => {
        sheet.processAtomic(css.data)
      })

      result.cva.forEach((cva) => {
        sheet.processAtomicRecipe(cva.data.raw)
      })

      result.jsx.forEach((jsx) => {
        const { css = {}, ...rest } = jsx.data.raw
        const styles = { ...rest, ...css }

        match(jsx)
          // treat pattern jsx like regular pattern
          .with({ type: 'pattern', name: P.string }, ({ name }) => {
            result.setPattern(patterns.getFnName(name), { data: styles })
          })
          // treat recipe jsx like regular recipe + atomic
          .with({ type: 'recipe', name: P.string }, ({ name }) => {
            const [recipeProps, styleProps] = recipes.splitProps(name, styles)
            result.setRecipe(recipes.getFnName(name), {
              data: { raw: recipeProps, conditions: [], spreadConditions: [] },
            })
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
            const styleProps = patterns.transform(name, pattern.data.raw)
            sheet.processAtomic(styleProps)
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
