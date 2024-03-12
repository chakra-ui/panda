import { logger } from '@pandacss/logger'
import type { CascadeLayer, Dict, GlobalVars, SystemStyleObject } from '@pandacss/types'
import layersPolyfill from '@csstools/postcss-cascade-layers'
import postcss, { CssSyntaxError } from 'postcss'
import { optimizeCss } from './optimize'
import { serializeStyles } from './serialize'
import { sortStyleRules } from './sort-style-rules'
import { stringify } from './stringify'
import type { StyleDecoder } from './style-decoder'
import type { CssOptions, LayerName, ProcessOptions, StylesheetContext } from './types'
import sortMediaQueries from './plugins/sort-mq'
import { stringifyGlobalVars } from './global-vars'

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
      layer.append(stringify(styles))
    } catch (error) {
      if (error instanceof CssSyntaxError) {
        logger.error('sheet:process', error.showSourceCode(true))
      }
    }
    return
  }

  serialize = (styles: Dict) => {
    return serializeStyles(this.context, styles)
  }

  processResetCss = (styles: Dict) => {
    const result = this.serialize(styles)

    let css = stringify(result)

    if (this.context.hooks['cssgen:done']) {
      css = this.context.hooks['cssgen:done']({ artifact: 'reset', content: css }) ?? css
    }

    this.context.layers.reset.append(css)
  }

  processGlobalCss = (styles: Dict, vars?: GlobalVars) => {
    const result = this.serialize(styles)
    let css = stringify(result)

    if (vars) {
      css += stringifyGlobalVars(vars, this.context.cssVarRoot)
    }

    if (this.context.hooks['cssgen:done']) {
      css = this.context.hooks['cssgen:done']({ artifact: 'global', content: css }) ?? css
    }

    this.context.layers.base.append(css)
  }

  processCss = (styles: SystemStyleObject | undefined, layer: LayerName) => {
    if (!styles) return
    this.process({ styles, layer })
  }

  processDecoder = (decoder: StyleDecoder) => {
    sortStyleRules([...decoder.atomic]).forEach((css) => {
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
      const breakpoints = this.context.conditions.breakpoints
      const root = this.context.layers.insert()

      breakpoints.expandScreenAtRule(root)

      const plugins: postcss.AcceptedPlugin[] = [sortMediaQueries()]
      if (this.context.polyfill) {
        plugins.push(layersPolyfill())
      }

      const result = postcss(plugins).process(root)
      const css = result.toString()
      if (!optimize) return css

      return optimizeCss(css, {
        minify,
        lightningcss: this.context.lightningcss,
        browserslist: this.context.browserslist,
      })
    } catch (error) {
      if (error instanceof CssSyntaxError) {
        logger.error('sheet:toCss', error.showSourceCode(true))
      }

      throw error
    }
  }
}
