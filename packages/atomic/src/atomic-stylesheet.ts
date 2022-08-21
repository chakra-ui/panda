import { AtomicRuleset } from './atomic-ruleset'
import { expandScreenAtRule } from './expand-screen'
import { GeneratorContext } from './types'
import { optimizeCss } from './optimize'
import { PluginResult } from '@css-panda/types'
import { toCss } from './to-css'
import postcss from 'postcss'

export class AtomicStylesheet {
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
      const ruleset = new AtomicRuleset(this.context, { hash: this.hash })
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
    const rules = imports.map((importName) => `@import '${importName}';`)
    this.context.root.prepend(...rules)
    return this
  }

  toCss() {
    expandScreenAtRule(this.context.root, this.context.breakpoints)
    const result = optimizeCss(this.context.root.toString())
    return result.css
  }

  reset() {
    this.context.root.removeAll()
  }
}
