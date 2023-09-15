import { logger } from '@pandacss/logger'
import { getSlotRecipes } from '@pandacss/shared'
import type { Dict, RecipeConfig, SlotRecipeConfig, SystemStyleObject } from '@pandacss/types'
import postcss, { CssSyntaxError } from 'postcss'
import { AtomicRule } from './atomic-rule'
import { isSlotRecipe } from './is-slot-recipe'
import { discardDuplicate, expandCssFunctions, optimizeCss } from './optimize'
import { Recipes } from './recipes'
import { safeParse } from './safe-parse'
import { serializeStyles } from './serialize'
import { toCss } from './to-css'
import type { StylesheetContext } from './types'

export type StylesheetOptions = {
  content?: string
  recipes?: Dict<RecipeConfig>
  slotRecipes?: Dict<SlotRecipeConfig>
}

export class Stylesheet {
  private recipes: Recipes

  constructor(private context: StylesheetContext, private options?: StylesheetOptions) {
    const { recipes = {}, slotRecipes = {} } = options ?? {}
    const recipeConfigs = Object.assign({}, recipes, slotRecipes)
    this.recipes = new Recipes(recipeConfigs, context)
  }

  processGlobalCss = (styleObject: Dict) => {
    const { conditions, utility } = this.context
    const css = serializeStyles(styleObject, { conditions, utility })

    // wrap css root in @layer directive
    const layer = postcss.atRule({
      name: 'layer',
      params: this.context.layers.base,
      nodes: [css],
    })

    this.context.root.append(layer)
  }

  processSelectorObject(selector: string, styleObject: Dict) {
    const cssString = toCss(styleObject)
    const { nodes } = safeParse(cssString)

    // don't process empty rulesets
    if (nodes.length === 0) return

    const output = postcss.rule({
      selector,
      nodes: cssString.root.nodes,
    })

    this.context.root.append(output)
  }

  processObject(styleObject: SystemStyleObject) {
    const result = toCss(styleObject)
    const output = result.root
    this.context.root.append(output)
  }

  processAtomic = (...styleObject: (SystemStyleObject | undefined)[]) => {
    const ruleset = new AtomicRule(this.context)
    styleObject.forEach((styles) => {
      if (!styles) return
      ruleset.process({ styles })
    })
  }

  processStyleProps = (styleObject: SystemStyleObject & { css?: SystemStyleObject }) => {
    const { css: cssObject, ...restStyles } = styleObject
    this.processAtomic(restStyles, cssObject)
  }

  processCompoundVariants = (config: RecipeConfig | SlotRecipeConfig) => {
    config.compoundVariants?.forEach((compoundVariant) => {
      if (isSlotRecipe(config)) {
        for (const css of Object.values(compoundVariant.css)) {
          this.processAtomic(css)
        }
      } else {
        this.processAtomic(compoundVariant.css)
      }
    })
  }

  processRecipe = (name: string, config: RecipeConfig | SlotRecipeConfig, styles: SystemStyleObject) => {
    this.recipes.process(name, { styles })
    this.processCompoundVariants(config)
  }

  processAtomicSlotRecipe = (recipe: Pick<SlotRecipeConfig, 'base' | 'variants' | 'compoundVariants'>) => {
    const slots = getSlotRecipes(recipe)
    for (const slotRecipe of Object.values(slots)) {
      this.processAtomicRecipe(slotRecipe)
    }
  }

  processAtomicRecipe = (recipe: Pick<RecipeConfig, 'base' | 'variants' | 'compoundVariants'>) => {
    const { base = {}, variants = {}, compoundVariants = [] } = recipe
    this.processAtomic(base)
    for (const variant of Object.values(variants)) {
      for (const styles of Object.values(variant)) {
        this.processAtomic(styles)
      }
    }

    compoundVariants.forEach((compoundVariant) => {
      this.processAtomic(compoundVariant.css)
    })
  }

  toCss = ({ optimize = false, minify }: { optimize?: boolean; minify?: boolean } = {}) => {
    try {
      const {
        conditions: { breakpoints },
        utility,
      } = this.context

      breakpoints.expandScreenAtRule(this.context.root)
      expandCssFunctions(this.context.root, { token: utility.getToken, raw: this.context.utility.tokens.getByName })

      let css = this.context.root.toString()

      if (optimize) {
        css = optimizeCss(css, { minify })
      }

      if (this.options?.content) {
        css = `${this.options.content}\n\n${css}`
      }

      return optimize ? discardDuplicate(css, { minify }) : css
    } catch (error) {
      if (error instanceof CssSyntaxError) {
        logger.error('sheet', error.message)
        error.plugin && logger.error('sheet', `By plugin: ${error.plugin}:`)

        if (error.source) {
          logger.error('sheet', `Line ${error.line}:${error.column}, in:`)
          logger.error('sheet', error.source)
        }
      }

      throw error
    }
  }

  append = (...css: string[]) => {
    this.context.root.append(...css)
  }

  prepend = (...css: string[]) => {
    this.context.root.prepend(...css)
  }
}
