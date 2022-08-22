import { Ruleset } from './ruleset'
import { expandScreenAtRule } from './expand-screen'
import { GeneratorContext } from './types'
import { optimizeCss } from './optimize'
import { PluginResult } from '@css-panda/types'
import { toCss } from './to-css'
import postcss from 'postcss'

export class Stylesheet {
  hash: boolean

  constructor(private context: GeneratorContext, options: { hash?: boolean } = {}) {
    this.hash = !!options.hash
  }

  process(result: PluginResult) {
    const { type, data, name } = result
    return type === 'object' ? this.processAtomic(data) : this.processObject(name!, data)
  }

  processObject(selector: string, styleObject: Record<string, any>) {
    const cssString = toCss(styleObject)
    const rule = postcss.rule({ selector, nodes: cssString.root.nodes })
    this.context.root.append(rule)
    return this
  }

  processAtomic(styleObject: Record<string, any>) {
    const { selectors = {}, '@media': mediaQueries = {}, ...styles } = styleObject

    const inner = (props: any, scope?: string) => {
      const ruleset = new Ruleset(this.context, { hash: this.hash })
      ruleset.process({ scope, styles: props })
    }

    inner(styles)

    for (const [scope, scopeStyles] of Object.entries(selectors)) {
      inner(scopeStyles as any, scope)
    }

    for (const [scope, scopeStyles] of Object.entries(mediaQueries)) {
      inner(scopeStyles as any, `@media ${scope}`)
    }

    return this
  }

  addImports(imports: string[]) {
    const rules = imports.map((n) => `@import '${n}';`)
    this.context.root.prepend(...rules, '\n')
    return this
  }

  toCss({ optimize = true, minify }: { optimize?: boolean; minify?: boolean } = {}) {
    expandScreenAtRule(this.context.root, this.context.breakpoints)
    const css = this.context.root.toString()
    return optimize ? optimizeCss(css, { minify }) : css
  }

  reset() {
    this.context.root.removeAll()
  }

  append(css: string) {
    this.context.root.append('\n', css)
    return this
  }
}
