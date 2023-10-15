import { logger } from '@pandacss/logger'
import { getSlotRecipes } from '@pandacss/shared'
import type { Dict, RecipeConfig, SlotRecipeConfig, SystemStyleObject } from '@pandacss/types'
import { CssSyntaxError } from 'postcss'
import { AtomicRule, type ProcessOptions } from './atomic-rule'
import { isSlotRecipe } from './is-slot-recipe'
import { optimizeCss, expandCssFunctions } from './optimize'
import { Recipes } from './recipes'
import { serializeStyles } from './serialize'
import type { StylesheetContext } from './types'

export type StylesheetOptions = {
  content?: string
  recipes?: Dict<RecipeConfig>
  slotRecipes?: Dict<SlotRecipeConfig>
}

export class Stylesheet {
  private recipes: Recipes

  constructor(private context: StylesheetContext, private options?: StylesheetOptions) {
    // console.log('new Stylesheet')
    const { recipes = {}, slotRecipes = {} } = options ?? {}
    const recipeConfigs = Object.assign({}, recipes, slotRecipes)
    this.recipes = new Recipes(recipeConfigs, context)
  }

  processGlobalCss = (styleObject: Dict) => {
    const { conditions, utility } = this.context
    const css = serializeStyles(styleObject, { conditions, utility })

    this.context.layersRoot.base.append(css)
  }

  processAtomic = (styleObject: SystemStyleObject | undefined, options?: Omit<ProcessOptions, 'styles'>) => {
    if (!styleObject) return
    const ruleset = new AtomicRule(this.context, options)
    ruleset.process(Object.assign({ styles: styleObject }, options))
  }

  processStyleProps = (styleObject: SystemStyleObject & { css?: SystemStyleObject }) => {
    const { css: cssObject, ...restStyles } = styleObject
    this.processAtomic(restStyles)
    this.processAtomic(cssObject)
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
        insertLayers,
      } = this.context

      this.context.root = insertLayers()
      breakpoints.expandScreenAtRule(this.context.root)
      expandCssFunctions(this.context.root, { token: utility.getToken, raw: this.context.utility.tokens.getByName })

      let css = this.context.root.toString()

      if (optimize) {
        css = optimizeCss(css, { minify })
      }

      if (this.options?.content) {
        css = `${this.options.content}\n\n${css}`
      }

      return optimize ? optimizeCss(css, { minify }) : css
    } catch (error) {
      if (error instanceof CssSyntaxError) {
        logger.error('sheet', error.message)
        console.log(error.showSourceCode())
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
