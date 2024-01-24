import { logger } from '@pandacss/logger'
import type { CascadeLayer, Dict } from '@pandacss/types'
import postcss, { CssSyntaxError } from 'postcss'
import { expandCssFunctions, optimizeCss } from './optimize'
import { serializeStyles } from './serialize'
import { sortStyleRules } from './sort-style-rules'
import { stringify } from './stringify'
import type { StyleDecoder } from './style-decoder'
import type { CssOptions, LayerType, ProcessOptions, StylesheetContext } from './types'

export class Stylesheet {
  constructor(private context: StylesheetContext) {}

  get layers() {
    return this.context.layers
  }

  getLayer(layer: LayerType) {
    return this.context.layers[layer] as postcss.AtRule | undefined
  }

  process(options: ProcessOptions) {
    const layer = this.layers.getLayerOfType(options.layerType, options.layer)
    if (!layer) return

    const { styles } = options

    // shouldn't happen, but just in case
    if (typeof styles !== 'object') return

    try {
      layer.append(stringify(styles))
    } catch (error) {
      if (error instanceof CssSyntaxError) {
        logger.error('sheet:process', error.showSourceCode(true))
      }
    }
  }

  serialize = (styles: Dict) => {
    return serializeStyles(this.context, styles)
  }

  processGlobalCss = (styles: Dict) => {
    const result = this.serialize(styles)
    let css = stringify(result)

    if (this.context.hooks['cssgen:done']) {
      css = this.context.hooks['cssgen:done']({ artifact: 'global', content: css }) ?? css
    }

    this.context.layers.base.append(css)
  }

  processCss = (options: ProcessOptions) => {
    if (!options.styles) return
    this.process(options)
  }

  processDecoder = (decoder: StyleDecoder) => {
    sortStyleRules([...decoder.atomic]).forEach((css) => {
      this.processCss({ styles: css.result, layer: css.layer, layerType: (css.layer as LayerType) ?? 'utilities' })
    })

    decoder.recipes.forEach((recipeSet) => {
      recipeSet.forEach((recipe) => {
        this.processCss({
          styles: recipe.result,
          layer: recipe.layer,
          layerType: recipe.entry.slot ? 'recipes_slots' : 'recipes',
        })
      })
    })

    decoder.recipes_base.forEach((recipeSet) => {
      recipeSet.forEach((recipe) => {
        this.processCss({
          styles: recipe.result,
          layer: recipe.layer,
          layerType: recipe.slot ? 'recipes_slots_base' : 'recipes_base',
        })
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
