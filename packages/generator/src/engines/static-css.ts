import type { StaticCssOptions } from '@pandacss/types'
import type { GeneratorBaseEngine } from './base'
import { HashCollector } from './hash-collector'
import { StylesCollector } from './styles-collector'

export const generateStaticCss = (
  ctx: GeneratorBaseEngine,
  params: { hash: HashCollector; styles: StylesCollector },
) => {
  const { createSheet, recipes } = ctx

  return (staticCss: StaticCssOptions) => {
    const sheet = createSheet()
    const fn = getStaticCss(ctx)

    const results = fn(staticCss)
    // console.log(JSON.stringify(results.recipes, null, 2))

    const { hash, styles } = params

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

    // console.log(hash)
    // console.log(styles.recipes.get('buttonStyle'))

    sheet.processStylesCollector(styles.collect(hash))

    const toCss = (options?: Pick<UserConfig, 'optimize' | 'minify'>) => {
      try {
        return sheet.toCss({ optimize, minify, ...options })
      } catch (err) {
        return ''
      }
    }

    // console.log(ctx.recipes['recipes'])
    // console.log(ctx.recipes.getConfig('checkbox'))
    // console.log(styles.recipes_slots.get('checkbox'))
    // console.log(styles.classNames)

    const createClassNameRegex = () => createRegex(Array.from(styles.classNames.keys()))
    const parse = (text: string) => {
      const regex = createClassNameRegex()

      const matches = text.match(regex)
      if (!matches) {
        return []
      }

      return matches.map((match) => match.replace('.', ''))
    }

    // const generate = (matches: string[]) => {
    //   // TODO re-use logic above

    //   return toCss({ optimize: false, minify: false })
    // }

    return { results, regex: createClassNameRegex, parse, toCss: sheet.toCss }
  }
}

function createRegex(classNames: string[]) {
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

/**
 * This transforms a static css config into the same format that's used by the hash collector,
 * so that it can be processed by the same logic as styles found in app code.
 *
 * e.g.
 * @example { css: [{ color: ['red', 'blue'] }] } => { css: [{ color: 'red }, { color: 'blue }] }
 * @example { css: [{ color: ['red'], conditions: ['md'] }] } => { css: [{ color: { base: 'red', md: 'red' } }] }
 *
 */
function getStaticCss(ctx: GeneratorBaseEngine) {
  const { utility, recipes } = ctx

  const breakpoints = Object.keys(ctx.config.theme?.breakpoints ?? {})
  const getPropertyKeys = (prop: string) => {
    const propConfig = utility.config[prop]
    if (!propConfig) return []

    const values = utility.getPropertyValues(propConfig)
    if (!values) return []

    return Object.keys(values)
  }

  const getRecipeKeys = (recipeName: string) => {
    const recipeConfig = recipes.details.find((detail) => detail.baseName === recipeName)
    return recipeConfig?.variantKeyMap
  }

  return (options: StaticCssOptions) => {
    const { css = [], recipes = {} } = options
    const results: { css: Record<string, any>[]; recipes: Record<string, any>[] } = { css: [], recipes: [] }

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
}
