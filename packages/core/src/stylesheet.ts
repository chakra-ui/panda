import type { Dict, RecipeConfig } from '@pandacss/types'
import postcss from 'postcss'
import { AtomicRule } from './atomic-rule'
import { discardDuplicate, expandCssFunctions, optimizeCss } from './optimize'
import { Recipe } from './recipe'
import { serializeStyles } from './serialize'
import { toCss } from './to-css'
import type { StylesheetContext } from './types'
import { safeParse } from './safe-parse'

export type StylesheetOptions = {
  content: string
}

export class Stylesheet {
  constructor(private context: StylesheetContext, private options?: StylesheetOptions) {}

  processGlobalCss = (styleObject: Dict) => {
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

  processObject(styleObject: Dict) {
    const result = toCss(styleObject)
    const output = result.root
    this.context.root.append(output)
  }

  processAtomic = (styleObject: Dict) => {
    const ruleset = new AtomicRule(this.context)
    ruleset.process({ styles: styleObject })
  }

  processRecipe = (config: RecipeConfig, styles: Record<string, any>) => {
    const recipe = new Recipe(config, this.context)
    recipe.process({ styles })
  }

  processAtomicRecipe = (recipe: Pick<RecipeConfig, 'base' | 'variants'>) => {
    const { base = {}, variants = {} } = recipe
    this.processAtomic(base)
    for (const variant of Object.values(variants)) {
      for (const styles of Object.values(variant)) {
        this.processAtomic(styles)
      }
    }
  }

  toCss = ({ optimize = true, minify }: { optimize?: boolean; minify?: boolean } = {}) => {
    const {
      conditions: { breakpoints },
      utility,
    } = this.context

    breakpoints.expandScreenAtRule(this.context.root)
    expandCssFunctions(this.context.root, { token: utility.getToken })

    let css = this.context.root.toString()

    if (optimize) {
      css = optimizeCss(css, { minify })
    }

    if (this.options) {
      css = `${this.options.content}\n\n${css}`
    }

    return discardDuplicate(css)
  }

  append = (...css: string[]) => {
    this.context.root.append(...css)
  }

  prepend = (...css: string[]) => {
    this.context.root.prepend(...css)
  }
}
