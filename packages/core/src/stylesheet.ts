import { walkStyles } from '@css-panda/shared'
import type { Dict, PluginResult, RecipeConfig } from '@css-panda/types'
import postcss from 'postcss'
import { AtomicRule } from './atomic-rule'
import { Breakpoints } from './breakpoints'
import { optimizeCss } from './optimize'
import { Recipe } from './recipe'
import { serializeStyles } from './serialize'
import { toCss } from './to-css'
import type { GeneratorContext } from './types'

export class Stylesheet {
  constructor(private context: GeneratorContext) {}

  process = (result: PluginResult) => {
    const { type, data, name } = result
    return type === 'object' ? this.processAtomic(data) : this.processSelectorObject(name!, data)
  }

  processFontFace = (result: PluginResult) => {
    const src = result.data.src?.join(',')
    return this.processObject({
      '@font-face': {
        ...result.data,
        fontFamily: JSON.stringify(result.name),
        src,
      },
    })
  }

  processGlobalCss = (result: PluginResult) => {
    const { conditions, utility } = this.context
    const styleObject = result.data
    const css = serializeStyles(styleObject, { conditions, utility })
    this.context.root.append(css)
  }

  processSelectorObject(selector: string, styleObject: Dict) {
    const cssString = toCss(styleObject)
    const { nodes } = postcss.parse(cssString)

    // don't process empty rulesets
    if (nodes.length === 0) return this

    const output = postcss.rule({
      selector,
      nodes: cssString.root.nodes,
    })

    this.context.root.append(output)

    return this
  }

  processObject(styleObject: Dict) {
    const result = toCss(styleObject)
    const output = result.root
    this.context.root.append(output)
    return this
  }

  processAtomic = (styleObject: Dict) => {
    const ruleset = new AtomicRule(this.context)
    return walkStyles(styleObject, (props: any, scope?: string[]) => {
      ruleset.process({ scope, styles: props })
    })
  }

  processRecipe = (config: RecipeConfig, styles: Record<string, any>) => {
    const recipe = new Recipe(config, this.context)
    recipe.process({ styles })
  }

  addImports = (imports: string[]) => {
    const rules = imports.map((n) => `@import '${n}';\n`)
    this.context.root.prepend(...rules)
    return this
  }

  toCss = ({ optimize = true, minify }: { optimize?: boolean; minify?: boolean } = {}) => {
    const breakpoint = new Breakpoints(this.context.breakpoints)
    breakpoint.expandScreenAtRule(this.context.root)
    const css = this.context.root.toString()
    return optimize ? optimizeCss(css, { minify }) : css
  }

  append = (css: string) => {
    this.context.root.append(css)
    return this
  }
}
