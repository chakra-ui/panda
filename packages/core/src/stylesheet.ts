import { logger } from '@pandacss/logger'
import { getSlotRecipes } from '@pandacss/shared'
import type { CascadeLayer, Dict, RecipeConfig, SlotRecipeConfig, SystemStyleObject } from '@pandacss/types'
import { CssSyntaxError } from 'postcss'
import { AtomicRule } from './atomic-rule'
import { isSlotRecipe } from './is-slot-recipe'
import { expandCssFunctions, optimizeCss } from './optimize'
import { serializeStyles } from './serialize'
import { toCss } from './to-css'
import type { StylesheetContext } from './types'

export class Stylesheet {
  content = ''

  constructor(private context: StylesheetContext) {}

  processGlobalCss = (styleObject: Dict) => {
    const { conditions, utility } = this.context
    const css = serializeStyles(styleObject, { conditions, utility })
    this.context.layers.base.append(css)
  }

  processObject(styleObject: SystemStyleObject) {
    const result = toCss(styleObject)
    const output = result.root
    this.context.layers.root.append(output)
  }

  processAtomic = (...styleObject: (SystemStyleObject | undefined)[]) => {
    const layers = this.context.layers

    const ruleset = new AtomicRule(this.context, ({ layer, rule }) => {
      if (layer === 'composition') {
        layers.utilities.compositions.append(rule)
      } else if (typeof layer === 'string') {
        layers.utilities.custom(layer).append(rule)
      } else {
        layers.utilities.root.append(rule)
      }
    })

    styleObject.forEach((styles) => {
      if (!styles) return
      const normalizedStyles = ruleset.normalize(styles)
      ruleset.process({ styles: normalizedStyles })
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
    this.context.recipes.process(name, { styles })
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

  getLayerCss = (...layers: CascadeLayer[]) => {
    return optimizeCss(
      layers
        .map((layer: CascadeLayer) => {
          return this.context.layers.getLayer(layer).toString()
        })
        .join('\n'),
    )
  }

  toCss = ({ optimize = false, minify }: { optimize?: boolean; minify?: boolean } = {}) => {
    try {
      const {
        conditions: { breakpoints },
        utility,
      } = this.context

      const root = this.context.layers.insert()

      breakpoints.expandScreenAtRule(root)
      expandCssFunctions(root, { token: utility.getToken, raw: this.context.utility.tokens.getByName })

      let css = root.toString()

      if (optimize) {
        css = optimizeCss(css, { minify })
      }

      if (this.content) {
        css = `${this.content}\n\n${css}`
      }

      return optimize ? optimizeCss(css, { minify }) : css
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
    this.context.layers.root.append(...css)
  }

  prepend = (...css: string[]) => {
    this.context.layers.root.prepend(...css)
  }

  clean = () => {
    this.context.layers.clean()
  }
}
