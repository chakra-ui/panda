import type { StaticCssOptions } from '@pandacss/types'
import type { GeneratorBaseEngine } from './base'
import { HashFactory } from './hash-factory'
import { StyleCollector } from './styles-collector'

interface StaticCssResults {
  css: Record<string, any>[]
  recipes: Record<string, any>[]
  // TODO patterns
}

interface StaticCssEngine {
  results: StaticCssResults
  regex: () => RegExp
  parse: (text: string) => string[]
  toCss: (options?: { optimize?: boolean; minify?: boolean }) => string
}

export class StaticCss {
  constructor(private context: GeneratorBaseEngine, private params: { hash: HashFactory; styles: StyleCollector }) {}

  /**
   * This transforms a static css config into the same format that's used by the hash collector,
   * so that it can be processed by the same logic as styles found in app code.
   *
   * e.g.
   * @example { css: [{ color: ['red', 'blue'] }] } => { css: [{ color: 'red }, { color: 'blue }] }
   * @example { css: [{ color: ['red'], conditions: ['md'] }] } => { css: [{ color: { base: 'red', md: 'red' } }] }
   *
   */
  getStyleRules(options: StaticCssOptions) {
    const { config, utility } = this.context
    const breakpoints = Object.keys(config.theme?.breakpoints ?? {})
    const getPropertyKeys = (prop: string) => {
      const propConfig = utility.config[prop]
      if (!propConfig) return []

      const values = utility.getPropertyValues(propConfig)
      if (!values) return []

      return Object.keys(values)
    }

    const getRecipeKeys = (recipeName: string) => {
      const recipeConfig = this.context.recipes.details.find((detail) => detail.baseName === recipeName)
      return recipeConfig?.variantKeyMap
    }

    const { css = [], recipes = {} } = options
    const results: StaticCssResults = { css: [], recipes: [] }

    css.forEach((rule) => {
      const conditions = rule.conditions || []

      Object.entries(rule.properties).forEach(([property, values]) => {
        const computedValues = values.flatMap((value) => (value === '*' ? getPropertyKeys(property) : value))

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
      rules.forEach((rule) => {
        const recipeKeys = getRecipeKeys(recipe)
        if (!recipeKeys) return

        const useAllKeys = rule === '*'
        const { conditions = [], ...variants } = useAllKeys ? recipeKeys : rule

        Object.entries(variants).forEach(([variant, values]) => {
          if (!Array.isArray(values)) return

          const computedValues = values.flatMap((value) => {
            if (value === '*') {
              return recipeKeys[variant]
            }

            return value
          })

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

    return results
  }

  process(staticCss: StaticCssOptions, fork?: boolean) {
    const { createSheet, recipes } = this.context
    const sheet = createSheet()

    const results = this.getStyleRules(staticCss)
    // console.log(JSON.stringify(results.recipes, null, 2))

    const hash = fork ? this.params.hash.fork() : this.params.hash
    const styles = fork ? this.params.styles.fork() : this.params.styles

    results.css.forEach((css) => {
      hash.hashStyleObject(hash.atomic, css)
    })

    results.recipes.forEach((result) => {
      Object.entries(result).forEach(([name, value]) => {
        const recipeConfig = recipes.getConfig(name)
        if (!recipeConfig) return

        if ('slots' in recipeConfig) {
          hash.processSlotRecipe(name, value)
        } else {
          hash.processRecipe(name, value)
        }
      })
    })

    sheet.processStyleCollector(styles.collect(hash))

    const createRegex = () => createClassNameRegex(Array.from(styles.classNames.keys()))
    const parse = (text: string) => {
      const regex = createRegex()

      const matches = text.match(regex)
      if (!matches) {
        return []
      }

      return matches.map((match) => match.replace('.', ''))
    }

    return { results, regex: createRegex, parse, toCss: sheet.toCss } as StaticCssEngine
  }
}

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
