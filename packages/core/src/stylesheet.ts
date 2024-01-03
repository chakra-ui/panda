import { logger } from '@pandacss/logger'
import type { CascadeLayer, Dict, StyleDecoderInterface, SystemStyleObject } from '@pandacss/types'
import postcss, { CssSyntaxError } from 'postcss'
import { expandCssFunctions, optimizeCss } from './optimize'
import { serializeStyles } from './serialize'
import { toCss } from './to-css'
import type { CssOptions, LayerName, ProcessOptions, StylesheetContext } from './types'

export class Stylesheet {
  constructor(private context: StylesheetContext) {}

  get layers() {
    return this.context.layers
  }

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
        logger.error('sheet:process', error)
      }
    }
    return
  }

  processGlobalCss = (styles: Dict) => {
    const { conditions, utility } = this.context
    const css = serializeStyles(styles, { conditions, utility })
    this.context.layers.base.append(css)
  }

  processCss = (styles: SystemStyleObject | undefined, layer: LayerName) => {
    if (!styles) return
    this.process({ styles, layer })
  }

  processDecoder = (decoder: StyleDecoderInterface) => {
    decoder.atomic.forEach((css) => {
      this.processCss(css.result, (css.layer as LayerName) ?? 'utilities')
    })

    decoder.recipes.forEach((recipeSet) => {
      recipeSet.forEach((recipe) => {
        this.processCss(recipe.result, recipe.entry.slot ? 'recipes_slots' : 'recipes')
      })
    })

    decoder.recipes_base.forEach((recipeSet) => {
      recipeSet.forEach((recipe) => {
        this.processCss(recipe.result, recipe.slot ? 'recipes_slots_base' : 'recipes_base')
      })
    })
  }

  getLayerCss = (...layers: CascadeLayer[]) => {
    return optimizeCss(
      layers
        .map((layer: CascadeLayer) => {
          return this.context.layers.getLayerRoot(layer).toString()
        })
        .join('\n'),
    )
  }

  toCss = ({ optimize = false, minify }: CssOptions = {}) => {
    try {
      const { utility } = this.context
      const breakpoints = this.context.conditions.breakpoints

      const root = this.context.layers.insert()

      breakpoints.expandScreenAtRule(root)
      expandCssFunctions(root, { token: utility.getToken, raw: this.context.utility.tokens.getByName })

      const css = root.toString()

      return optimize ? optimizeCss(css, { minify }) : css
    } catch (error) {
      if (error instanceof CssSyntaxError) {
        logger.error('sheet:toCss', error.message)
        error.plugin && logger.error('sheet:toCss', `By plugin: ${error.plugin}:`)

        if (error.source) {
          logger.error('sheet:toCss', `Line ${error.line}:${error.column}, in:`)
          logger.error('sheet:toCss', error.source)
        }
      }

      throw error
    }
  }
}
