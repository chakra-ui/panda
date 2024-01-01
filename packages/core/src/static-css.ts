import type { Stylesheet } from '@pandacss/core'
import type { CssRule, StaticCssOptions } from '@pandacss/types'
import type { CoreContext } from './core-context'
import { StyleDecoder } from './style-decoder'
import { StyleEncoder } from './style-encoder'

interface StaticCssResults {
  css: Record<string, any>[]
  recipes: Record<string, any>[]
  patterns: Record<string, any>[]
}

interface StaticCssEngine {
  results: StaticCssResults
  regex: () => RegExp
  parse: (text: string) => string[]
  sheet: Stylesheet
}

export class StaticCss {
  encoder: StyleEncoder
  decoder: StyleDecoder

  constructor(private context: CoreContext) {
    this.encoder = context.encoder
    this.decoder = context.decoder
  }

  clone() {
    this.encoder = this.encoder.clone()
    this.decoder = this.decoder.clone()
    return this
  }

  /**
   * This transforms a static css config into the same format as in the ParserResult,
   * so that it can be processed by the same logic as styles found in app code.
   *
   * e.g.
   * @example { css: [{ color: ['red', 'blue'] }] } => { css: [{ color: 'red }, { color: 'blue }] }
   * @example { css: [{ color: ['red'], conditions: ['md'] }] } => { css: [{ color: { base: 'red', md: 'red' } }] }
   *
   */
  getStyleObjects(options: StaticCssOptions) {
    const { config, utility, patterns: _patterns } = this.context
    const breakpoints = Object.keys(config.theme?.breakpoints ?? {})

    const getRecipeKeys = (recipeName: string) => {
      const recipeConfig = this.context.recipes.details.find((detail) => detail.baseName === recipeName)
      return recipeConfig?.variantKeyMap
    }

    const { css = [], recipes = {}, patterns = {} } = options
    const results: StaticCssResults = { css: [], recipes: [], patterns: [] }

    css.forEach((rule) => {
      const conditions = rule.conditions || []
      if (rule.responsive) {
        conditions.push(...breakpoints)
      }

      Object.entries(rule.properties).forEach(([property, values]) => {
        const propKeys = utility.getPropertyKeys(property)
        const computedValues = values.flatMap((value) => (value === '*' ? propKeys : value))

        computedValues.forEach((value) => {
          const conditionalValues = conditions.reduce(
            (acc, condition) => ({
              base: value,
              ...acc,
              [formatCondition(breakpoints, condition)]: value,
            }),
            {},
          )

          results.css.push({
            [property]: conditions.length ? conditionalValues : value,
          })
        })
      })
    })

    Object.entries(recipes).forEach(([recipe, rules]) => {
      // adds the recipe.base to the results
      results.recipes.push({ [recipe]: {} })

      rules.forEach((rule) => {
        const recipeKeys = getRecipeKeys(recipe)
        if (!recipeKeys) return

        const useAllKeys = rule === '*'
        const { conditions = [], responsive, ...variants } = useAllKeys ? recipeKeys : rule

        if (responsive) {
          conditions.push(...breakpoints)
        }

        Object.entries(variants).forEach(([variant, values]) => {
          if (!Array.isArray(values)) return

          const computedValues = values.flatMap((value) => (value === '*' ? recipeKeys[variant] : value))

          computedValues.forEach((value) => {
            const conditionalValues = conditions.reduce(
              (acc, condition) => ({
                base: value,
                ...acc,
                [formatCondition(breakpoints, condition)]: value,
              }),
              {},
            )

            results.recipes.push({
              [recipe]: { [variant]: conditions.length ? conditionalValues : value },
            })
          })
        })
      })
    })

    Object.entries(patterns).forEach(([pattern, rules]) => {
      rules.forEach((rule) => {
        const details = this.context.patterns.details.find((d) => d.baseName === pattern)
        if (!details) return

        let props = {} as CssRule['properties']
        const useAllKeys = rule === '*'
        if (useAllKeys) {
          props = Object.fromEntries((details.props ?? []).map((key) => [key, ['*']]))
        }

        const { conditions = [], responsive = false, properties = props } = useAllKeys ? {} : rule
        if (responsive) {
          conditions.push(...breakpoints)
        }

        Object.entries(properties).forEach(([property, values]) => {
          const propValues = _patterns.getPropertyValues(pattern, property)
          const computedValues = values.flatMap((value) => (value === '*' ? propValues : value))

          computedValues.forEach((patternValue) => {
            const value = this.context.patterns.transform(pattern, { [property]: patternValue })
            const conditionalValues = conditions.reduce(
              (acc, condition) => ({
                base: value,
                ...acc,
                [formatCondition(breakpoints, condition)]: value,
              }),
              {},
            )

            results.patterns.push(conditions.length ? conditionalValues : value)
          })
        })
      })
    })

    return results
  }

  createRegex = () => {
    const { decoder } = this
    return createClassNameRegex(Array.from(decoder.classNames.keys()))
  }

  process(staticCss: StaticCssOptions, stylesheet?: Stylesheet) {
    const { recipes } = this.context
    const sheet = stylesheet ?? this.context.createSheet()

    staticCss.recipes = staticCss.recipes ?? {}

    const { theme = {} } = this.context.config
    const recipeConfigs = Object.assign({}, theme.recipes, theme.slotRecipes)

    Object.entries(recipeConfigs).forEach(([name, recipe]) => {
      if (recipe.staticCss) {
        staticCss.recipes![name] = recipe.staticCss
      }
    })

    const results = this.getStyleObjects(staticCss)
    // console.log(JSON.stringify(results.recipes, null, 2))

    const { encoder, decoder } = this

    results.css.forEach((css) => {
      encoder.hashStyleObject(encoder.atomic, css)
    })

    results.recipes.forEach((result) => {
      Object.entries(result).forEach(([name, value]) => {
        const recipeConfig = recipes.getConfig(name)
        if (!recipeConfig) return

        encoder.processRecipe(name, value)
      })
    })

    results.patterns.forEach((result) => {
      encoder.hashStyleObject(encoder.atomic, result)
    })

    sheet.processDecoder(decoder.collect(encoder))

    const parse = (text: string) => {
      const regex = this.createRegex()

      const matches = text.match(regex)
      if (!matches) return []

      return matches.map((match) => match.replace('.', ''))
    }

    return {
      results,
      regex: this.createRegex.bind(this),
      parse,
      sheet,
    } as StaticCssEngine
  }
}

// ??? Replace with shared one
function createClassNameRegex(classNames: string[]) {
  const escapedClassNames = classNames.map((name) => escapeRegExp(name))
  const pattern = `(${escapedClassNames.join('|')})`
  return new RegExp(`\\b${pattern}\\b`, 'g')
}

const ESCAPE_CHARS = /[.*+?^${}()|[\]\\]/g
const ESCAPE_MAP: Record<string, string> = {
  '.': '\\.',
  '*': '\\*',
  '+': '\\+',
  '?': '\\?',
  '^': '\\^',
  $: '\\$',
  '{': '\\{',
  '}': '\\}',
  '(': '\\(',
  ')': '\\)',
  '[': '\\[',
  ']': '\\]',
  '\\': '\\\\',
  '|': '\\|',
}

function escapeRegExp(str: string): string {
  return str.replace(ESCAPE_CHARS, (match) => ESCAPE_MAP[match])
}

const formatCondition = (breakpoints: string[], value: string) => (breakpoints.includes(value) ? value : `_${value}`)
