import { logger } from '@pandacss/logger'
import type { CascadeLayer, Dict, SystemStyleObject } from '@pandacss/types'
import postcss, { CssSyntaxError } from 'postcss'
import { expandCssFunctions, optimizeCss } from './optimize'
import { serializeStyles } from './serialize'
import type { StyleDecoder } from './style-decoder'
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
      layer.append(toCss(styles))
    } catch (error) {
      if (error instanceof CssSyntaxError) {
        logger.error('sheet:process', error.showSourceCode(true))
      }
    }
    return
  }

  processGlobalCss = (styles: Dict) => {
    const result = serializeStyles(this.context, styles)
    this.context.layers.base.append(toCss(result))
  }

  processCss = (styles: SystemStyleObject | undefined, layer: LayerName) => {
    if (!styles) return
    this.process({ styles, layer })
  }

  processDecoder = (decoder: StyleDecoder) => {
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
      {
        minify: false,
        lightningcss: this.context.lightningcss,
        browserslist: this.context.browserslist,
      },
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

      return optimize
        ? optimizeCss(css, {
            minify,
            lightningcss: this.context.lightningcss,
            browserslist: this.context.browserslist,
          })
        : css
    } catch (error) {
      if (error instanceof CssSyntaxError) {
        logger.error('sheet:toCss', error.showSourceCode(true))
      }

      throw error
    }
  }
}
