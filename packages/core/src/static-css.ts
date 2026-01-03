import type { RecipeNode, Stylesheet } from '@pandacss/core'
import { logger } from '@pandacss/logger'
import { esc } from '@pandacss/shared'
import type { CssRule, Dict, PatternRule, RecipeRule, StaticCssOptions } from '@pandacss/types'
import type { Context } from './context'
import { StyleDecoder } from './style-decoder'
import { StyleEncoder } from './style-encoder'

interface StaticCssResults {
  css: Record<string, any>[]
  recipes: Record<string, any>[]
  patterns: Record<string, any>[]
}

type StaticCssContext = Pick<
  Context,
  'encoder' | 'decoder' | 'utility' | 'patterns' | 'recipes' | 'createSheet' | 'config'
>

interface StaticCssEngine {
  results: StaticCssResults
  sheet: Stylesheet
}

export class StaticCss {
  encoder: StyleEncoder
  decoder: StyleDecoder

  private breakpointKeys: string[]
  private conditionKeys: string[]

  // Wildcard expansion cache - this is the main performance optimization
  // Memoizing wildcard expansions avoids redundant token lookups
  private wildcardCache = new Map<string, (string | number)[]>()

  constructor(private context: StaticCssContext) {
    this.encoder = context.encoder
    this.decoder = context.decoder

    this.breakpointKeys = Object.keys(context.config.theme?.breakpoints ?? {})
    this.conditionKeys = Object.keys(context.config.conditions ?? {})
  }

  clone() {
    this.encoder = this.encoder.clone()
    this.decoder = this.decoder.clone()
    return this
  }

  private formatCondition = (condition: string) => {
    return this.conditionKeys.includes(condition) ? `_${condition}` : condition
  }

  private getConditionalValues = (conditions: string[], value: any) => {
    return conditions.reduce(
      (acc, key) => {
        const cond = this.formatCondition(key)
        return { ...acc, [cond]: value }
      },
      { base: value },
    )
  }

  private createRegex = () => {
    const classNames = Array.from(this.decoder.classNames.keys())
    const escapedClassNames = classNames.map((name) => esc(name))
    const pattern = `(${escapedClassNames.join('|')})`
    return new RegExp(`\\b${pattern}\\b`, 'g')
  }

  parse = (text: string) => {
    const regex = this.createRegex()
    const matches = text.match(regex)
    if (!matches) return []
    return matches.map((match) => match.replace('.', ''))
  }

  /**
   * Get property keys with memoization for wildcard expansion
   * This is the main performance optimization - avoids redundant token lookups
   */
  private getCachedPropertyKeys = (property: string): (string | number)[] => {
    const cached = this.wildcardCache.has(property)
    if (!cached) {
      const keys = this.context.utility.getPropertyKeys(property)
      this.wildcardCache.set(property, keys)
      logger.debug('static_css:wildcard', `${property} -> ${keys.length} values (memoized)`)
    } else {
      logger.debug('static_css:wildcard', `${property} (cache hit)`)
    }
    return this.wildcardCache.get(property)!
  }

  /**
   * Get pattern property values with memoization
   */
  private getCachedPatternPropertyValues = (patternName: string, property: string): (string | number)[] => {
    const cacheKey = `${patternName}:${property}`
    const cached = this.wildcardCache.has(cacheKey)
    if (!cached) {
      const values = this.context.patterns.getPropertyValues(patternName, property) ?? []
      this.wildcardCache.set(cacheKey, values)
      logger.debug('static_css:wildcard', `Pattern ${patternName}.${property} -> ${values.length} values (memoized)`)
    } else {
      logger.debug('static_css:wildcard', `Pattern ${patternName}.${property} (cache hit)`)
    }
    return this.wildcardCache.get(cacheKey)!
  }

  private getCssObjects = (entry: [string, Array<string | number>], conditions: string[]) => {
    const [property, values] = entry

    const propKeys = this.getCachedPropertyKeys(property)
    const computedValues = values.flatMap((value) => (value === '*' ? propKeys : value))

    return computedValues.map((value) => ({
      [property]: conditions.length ? this.getConditionalValues(conditions, value) : value,
    }))
  }

  getCssRuleObjects = (rule: CssRule) => {
    const conditions = rule.conditions || []
    if (rule.responsive) {
      conditions.push(...this.breakpointKeys)
    }
    const entries = Object.entries(rule.properties)
    return entries.flatMap((entry) => this.getCssObjects(entry, conditions))
  }

  private getPatternObjects = (name: string, entry: [string, Array<string | number>], conditions: string[]): Dict[] => {
    const [property, values] = entry

    const propValues = this.getCachedPatternPropertyValues(name, property)
    const computedValues = values.flatMap((value) => (value === '*' ? propValues : value))

    return computedValues.map((patternValue) => {
      const value = this.context.patterns.transform(name, { [property]: patternValue })
      const conditionalValues = this.getConditionalValues(conditions, value)
      return conditions.length ? conditionalValues : value
    })
  }

  getPatternRuleObjects = (name: string, pattern: PatternRule): Dict[] => {
    const details = this.context.patterns.details.find((d) => d.baseName === name)
    if (!details) return []

    const useAllKeys = pattern === '*'

    let props = {} as CssRule['properties']
    if (useAllKeys) {
      props = Object.fromEntries((details.props ?? []).map((key) => [key, ['*']]))
    }

    const { conditions = [], responsive = false, properties = props } = useAllKeys ? {} : pattern

    if (responsive) {
      conditions.push(...this.breakpointKeys)
    }

    const entries = Object.entries(properties)
    return entries.flatMap((entry) => this.getPatternObjects(name, entry, conditions))
  }

  private getRecipeNode = (name: string) => {
    return this.context.recipes.details.find((detail) => detail.baseName === name)
  }

  getRecipeRuleObjects = (name: string, recipe: RecipeRule, recipeNode: RecipeNode): Dict[] => {
    const recipeKeys = recipeNode.variantKeyMap
    if (!recipeKeys) return []

    const useAllKeys = recipe === '*'
    const { conditions = [], responsive, ...variants } = useAllKeys ? recipeKeys : recipe

    if (responsive) {
      conditions.push(...this.breakpointKeys)
    }

    return Object.entries(variants).flatMap(([variant, values]) => {
      if (!Array.isArray(values)) return []
      const computedValues = values.flatMap((value) => (value === '*' ? recipeKeys[variant] : value))
      return computedValues.map((value) => {
        const conditionalValues = this.getConditionalValues(conditions, value)
        return { [name]: { [variant]: conditions.length ? conditionalValues : value } }
      })
    })
  }

  getRecipeCompoundVariantCssObjects = (recipeNode: RecipeNode) => {
    const cssRules: Dict[] = []
    const { compoundVariants } = recipeNode.config

    if (!compoundVariants) return cssRules

    compoundVariants.forEach((compoundVariant) => {
      const css = compoundVariant.css
      const isSlot = 'slots' in recipeNode.config && recipeNode.config.slots.length

      if (isSlot) {
        Object.values(css).forEach((styles) => {
          Object.entries(styles).forEach(([prop, value]) => {
            cssRules.push({ [prop]: value })
          })
        })
      } else {
        Object.entries(css).forEach(([prop, value]) => {
          cssRules.push({ [prop]: value })
        })
      }
    })

    return cssRules
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
    const { css = [], patterns = {} } = options

    const results: StaticCssResults = {
      css: [],
      recipes: [],
      patterns: [],
    }

    css.forEach((rule) => {
      const cssObjects = this.getCssRuleObjects(rule)
      results.css.push(...cssObjects)
    })

    const recipes = (options.recipes ?? {}) as Record<string, RecipeRule[]>

    Object.entries(recipes).forEach(([recipe, rules]) => {
      const recipeNode = this.getRecipeNode(recipe)
      if (!recipeNode) return

      // adds the recipe.base to the results
      results.recipes.push({ [recipe]: {} })

      if (recipeNode.config.compoundVariants) {
        results.css.push(...this.getRecipeCompoundVariantCssObjects(recipeNode))
      }

      rules.forEach((rule) => {
        results.recipes.push(...this.getRecipeRuleObjects(recipe, rule, recipeNode))
      })
    })

    Object.entries(patterns).forEach(([pattern, rules]) => {
      rules.forEach((rule) => {
        results.patterns.push(...this.getPatternRuleObjects(pattern, rule))
      })
    })

    return results
  }

  process = (options: StaticCssOptions, stylesheet?: Stylesheet): StaticCssEngine => {
    const { context } = this

    const sheet = stylesheet ?? context.createSheet()

    // Determine which encoder/decoder to use
    // If this is a cloned instance (encoder !== context.encoder), use fresh instances each time
    // to avoid state accumulation across multiple process() calls
    const isClonedInstance = this.encoder !== context.encoder
    const encoder = isClonedInstance ? context.encoder.clone() : this.encoder
    const decoder = isClonedInstance ? context.decoder.clone() : this.decoder

    // Normalize the staticCss config
    const staticCss = {
      ...options,
      recipes: { ...(typeof options.recipes === 'string' ? {} : options.recipes) },
    } satisfies StaticCssOptions

    const { theme = {} } = context.config

    const recipeConfigs = Object.assign({}, theme.recipes, theme.slotRecipes)
    const useAllRecipes = options.recipes === '*'

    Object.entries(recipeConfigs).forEach(([name, recipe]) => {
      if (useAllRecipes) {
        // When recipes: "*" is set globally, always use ['*'] for all recipes
        // This should NOT be overridden by individual recipe.staticCss configs
        staticCss.recipes[name] = ['*']
      } else if (recipe.staticCss) {
        // Only use recipe-level staticCss when not using global wildcard
        staticCss.recipes[name] = recipe.staticCss
      }
    })

    logger.debug('static_css:process', `Processing staticCss`)

    const results = this.getStyleObjects(staticCss)

    logger.debug(
      'static_css:process',
      `Generated style objects: ${results.css.length} css, ${results.recipes.length} recipes, ${results.patterns.length} patterns`,
    )

    results.css.forEach((css) => {
      encoder.hashStyleObject(encoder.atomic, css)
    })

    results.recipes.forEach((result) => {
      Object.entries(result).forEach(([name, value]) => {
        encoder.processRecipe(name, value)
      })
    })

    results.patterns.forEach((result) => {
      encoder.hashStyleObject(encoder.atomic, result)
    })

    sheet.processDecoder(decoder.collect(encoder))

    return {
      results,
      sheet,
    }
  }
}
