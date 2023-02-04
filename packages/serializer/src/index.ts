import { getStaticCss } from '@pandacss/core'
import { logger } from '@pandacss/logger'
import type { ParserResult, UserConfig } from '@pandacss/types'
import { Obj, pipe } from 'lil-fp'
import { match, P } from 'ts-pattern'
import { getCoreEngine } from './core'
import { getPatternEngine } from './pattern'
import { getRecipeEngine } from './recipe'

const defaults = (config: UserConfig): UserConfig => ({
  cssVarRoot: ':where(:root, :host)',
  jsxFactory: 'panda',
  outExtension: 'mjs',
  ...config,
})

export const createSerializer = (conf: UserConfig) =>
  pipe(
    defaults(conf),
    (conf) => ({
      ...getCoreEngine(conf),
      patterns: getPatternEngine(conf),
      recipes: getRecipeEngine(conf),
    }),

    Obj.bind('getParserCss', ({ createSheet, patterns, recipes, config }) => {
      return (result: ParserResult) => {
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

        return sheet.toCss({ minify: config.minify })
      }
    }),

    Obj.bind('getGlobalCss', ({ createSheet, config: { globalCss = {} } }) => {
      const sheet = createSheet()
      sheet.processGlobalCss({
        ':root': { '--made-with-panda': `'🐼'` },
      })
      sheet.processGlobalCss(globalCss)
      return sheet.toCss()
    }),

    Obj.bind('getStaticCss', ({ createSheet, utility, recipes, config }) => {
      const { staticCss = {}, theme = {} } = config

      const sheet = createSheet()
      const getCss = getStaticCss(staticCss)

      const results = getCss({
        breakpoints: Object.keys(theme.breakpoints ?? {}),
        getPropertyKeys: utility.getPropertyKeys,
        getRecipeKeys: (recipe) => recipes.details[recipe],
      })

      results.css.forEach((css) => {
        sheet.processAtomic(css)
      })

      results.recipes.forEach((result) => {
        Object.entries(result).forEach(([name, value]) => {
          const recipeConfig = recipes.getConfig(name)
          if (!recipeConfig) return
          sheet.processRecipe(recipeConfig, value)
        })
      })

      return sheet.toCss()
    }),
  )
