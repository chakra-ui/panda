import { walkStyles } from '@css-panda/shared'
import type { Dict, RecipeConfig } from '@css-panda/types'
import postcss from 'postcss'
import { AtomicRule } from './atomic-rule'
import { Breakpoints } from './breakpoints'
import { optimizeCss } from './optimize'
import { Recipe } from './recipe'
import { serializeStyles } from './serialize'
import { toCss } from './to-css'
import type { StylesheetContext } from './types'

export class Stylesheet {
  constructor(private context: StylesheetContext, private options?: { content: string }) {}

  addGlobalCss = (styleObject: Dict) => {
    const { conditions, utility } = this.context
    const css = serializeStyles(styleObject, { conditions, utility })

    // wrap css root in @layer directive
    const layer = postcss.atRule({
      name: 'layer',
      params: 'base',
      nodes: [css],
    })

    this.context.root.append(layer)
  }

  processGlobalCss = (styleObject: Dict) => {
    this.addGlobalCss(styleObject)
  }

  processSelectorObject(selector: string, styleObject: Dict) {
    const cssString = toCss(styleObject)
    const { nodes } = postcss.parse(cssString)

    // don't process empty rulesets
    if (nodes.length === 0) return

    const output = postcss.rule({
      selector,
      nodes: cssString.root.nodes,
    })

    this.context.root.append(output)
  }

  processObject(styleObject: Dict) {
    const result = toCss(styleObject)
    const output = result.root
    this.context.root.append(output)
  }

  processAtomic = (styleObject: Dict) => {
    const ruleset = new AtomicRule(this.context)
    return walkStyles(styleObject, (styles: any, scope?: string[]) => {
      ruleset.process({ scope, styles })
    })
  }

  processRecipe = (config: RecipeConfig, styles: Record<string, any>) => {
    const recipe = new Recipe(config, this.context)
    recipe.process({ styles })
  }

  toCss = ({ optimize = true, minify }: { optimize?: boolean; minify?: boolean } = {}) => {
    const breakpoint = new Breakpoints(this.context.breakpoints)
    breakpoint.expandScreenAtRule(this.context.root)

    let css = this.context.root.toString()

    if (optimize) {
      css = optimizeCss(css, { minify })
    }

    if (this.options) {
      css = `${this.options.content}\n\n${css}`
    }

    return css
  }

  append = (css: string) => {
    this.context.root.append(css)
  }

  prepend = (css: string) => {
    this.context.root.prepend(css)
  }
}
