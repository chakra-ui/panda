import { logger } from '@pandacss/logger'
import type { Dict, StyleCollectorType, SystemStyleObject, UserConfig } from '@pandacss/types'
import postcss, { CssSyntaxError } from 'postcss'
import { expandCssFunctions, optimizeCss } from './optimize'
import { serializeStyles } from './serialize'
import { toCss } from './to-css'
import type { StylesheetContext } from './types'

export interface ProcessOptions {
  styles: Dict
  layer: LayerName
}

export interface ToCssOptions extends Pick<UserConfig, 'optimize' | 'minify'> {}

export type LayerName = Exclude<keyof StylesheetContext['layers'], 'insert'>

export class Stylesheet {
  content: string = ''

  constructor(private context: StylesheetContext) {}

  getLayer(layer: LayerName) {
    return this.context.layers[layer] as postcss.AtRule | undefined
  }

  process(options: ProcessOptions) {
    const layer = this.getLayer(options.layer)
    if (!layer) return

    const { styles } = options

    // shouldn't happen, but just in case
    if (typeof styles !== 'object') return

    try {
      layer.append(toCss(styles).toString())
    } catch (error) {
      if (error instanceof CssSyntaxError) {
        logger.error('sheet', error)
      }
    }
    return
  }

  processGlobalCss = (styleObject: Dict) => {
    const { conditions, utility } = this.context
    const css = serializeStyles(styleObject, { conditions, utility })

    this.context.layers.base.append(css)
  }

  processCssObject = (styles: SystemStyleObject | undefined, layer: LayerName) => {
    if (!styles) return
    this.process({ styles, layer })
  }

  processStyleCollector = (collector: StyleCollectorType) => {
    collector.atomic.forEach((css) => {
      this.processCssObject(css.result, (css.layer as LayerName) ?? 'utilities')
    })

    collector.recipes.forEach((recipeSet) => {
      recipeSet.forEach((recipe) => {
        this.processCssObject(recipe.result, 'recipes')
      })
    })

    collector.recipes_base.forEach((recipeSet) => {
      recipeSet.forEach((recipe) => {
        this.processCssObject(recipe.result, 'recipes_base')
      })
    })

    collector.recipes_slots.forEach((recipeSet) => {
      recipeSet.forEach((recipe) => {
        this.processCssObject(recipe.result, 'recipes_slots')
      })
    })

    collector.recipes_slots_base.forEach((recipeSet) => {
      recipeSet.forEach((recipe) => {
        this.processCssObject(recipe.result, 'recipes_slots_base')
      })
    })
  }

  setContent = (content: string) => {
    this.content = content
    return this
  }

  toCss = ({ optimize = false, minify }: ToCssOptions = {}) => {
    try {
      const { utility } = this.context
      const breakpoints = this.context.conditions.breakpoints
      this.context.root = this.context.layers.insert()

      breakpoints.expandScreenAtRule(this.context.root)
      expandCssFunctions(this.context.root, { token: utility.getToken, raw: this.context.utility.tokens.getByName })

      let css = this.context.root.toString()

      if (this.content) {
        css = `${this.content}\n\n${css}`
      }

      return optimize ? optimizeCss(css, { minify }) : css
    } catch (error) {
      if (error instanceof CssSyntaxError) {
        logger.error('sheet', error)
      }

      throw error
    }
  }
}
