import type { Stylesheet } from '@pandacss/core'
import type { CssRule, StaticCssOptions, StyleCollectorType } from '@pandacss/types'
import type { Context } from './index'
import { HashFactory } from './hash-factory'
import { StyleCollector } from './style-collector'

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
  hash: HashFactory
  styles: StyleCollector

  constructor(private context: Context, params: { hash: HashFactory; styles: StyleCollector }) {
    this.hash = params.hash
    this.styles = params.styles
  }

  fork() {
    this.hash = this.hash.fork()
    this.styles = this.styles.fork()
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

    const getPatternPropValues = (patternName: string, property: string) => {
      const patternConfig = this.context.patterns.getConfig(patternName)
      if (!patternConfig) return []

      const propType = patternConfig.properties?.[property]
      if (!propType) return

      if (propType.type === 'enum') {
        return propType.value
      }

      if (propType.type === 'boolean') {
        return ['true', 'false']
      }

      if (propType.type === 'property') {
        return getPropertyKeys(property)
      }

      if (propType.type === 'token') {
        const values = this.context.tokens.getValue(propType.value)
        return Object.keys(values ?? {})
      }
    }

    const { css = [], recipes = {}, patterns = {} } = options
    const results: StaticCssResults = { css: [], recipes: [], patterns: [] }

    css.forEach((rule) => {
      const conditions = rule.conditions || []
      if (rule.responsive) {
        conditions.push(...breakpoints)
      }

      Object.entries(rule.properties).forEach(([property, values]) => {
        const propKeys = getPropertyKeys(property)
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
          props = Object.fromEntries((details.props ?? {}).map((key) => [key, ['*']]))
        }

        const { conditions = [], responsive = false, properties = props } = useAllKeys ? {} : rule
        if (responsive) {
          conditions.push(...breakpoints)
        }

        Object.entries(properties).forEach(([property, values]) => {
          const patternKeys = getPatternPropValues(pattern, property)
          const computedValues = values.flatMap((value) => (value === '*' ? patternKeys : value))

          computedValues.forEach((value) => {
            const conditionalValues = conditions.reduce(
              (acc, condition) => ({
                base: value,
                ...acc,
                [formatCondition(breakpoints, condition)]: value,
              }),
              {},
            )

            results.patterns.push({
              [pattern]: { [property]: conditions.length ? conditionalValues : value },
            })
          })
        })
      })
    })

    return results
  }

  process(staticCss: StaticCssOptions, stylesheet?: Stylesheet) {
    const { recipes } = this.context
    const sheet = stylesheet ?? this.context.createSheet()

    const results = this.getStyleObjects(staticCss)
    // console.log(JSON.stringify(results.recipes, null, 2))

    const { hash, styles } = this

    results.css.forEach((css) => {
      hash.hashStyleObject(hash.atomic, css)
    })

    results.recipes.forEach((result) => {
      Object.entries(result).forEach(([name, value]) => {
        const recipeConfig = recipes.getConfig(name)
        if (!recipeConfig) return

        hash.processRecipe(name, value)
      })
    })

    results.patterns.forEach((result) => {
      Object.entries(result).forEach(([name, value]) => {
        hash.processPattern(name, value)
      })
    })

    sheet.processStyleCollector(styles.collect(hash) as StyleCollectorType)

    const createRegex = () => createClassNameRegex(Array.from(styles.classNames.keys()))
    const parse = (text: string) => {
      const regex = createRegex()

      const matches = text.match(regex)
      if (!matches) {
        return []
      }

      return matches.map((match) => match.replace('.', ''))
    }

    return { results, regex: createRegex, parse, sheet } as StaticCssEngine
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
