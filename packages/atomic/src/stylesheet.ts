import { Ruleset } from './ruleset'
import { expandScreenAtRule } from './expand-screen'
import { GeneratorContext } from './types'
import { optimizeCss } from './optimize'
import { PluginResult } from '@css-panda/types'
import { toCss } from './to-css'
import postcss, { Root, Rule } from 'postcss'

export class Stylesheet {
  hash: boolean

  constructor(private context: GeneratorContext, options: { hash?: boolean } = {}) {
    this.hash = !!options.hash
  }

  process(result: PluginResult) {
    const { type, data, name } = result
    return type === 'object' ? this.processAtomic(data) : this.processObject(name!, data)
  }

  processFontFace(result: PluginResult) {
    const src = result.data.src?.join(',')
    return this.processObject({
      '@font-face': {
        ...result.data,
        fontFamily: JSON.stringify(result.name),
        src,
      },
    })
  }

  processObject(styleObject: Record<string, any>): ThisType<StyleSheet>
  processObject(selector: string, styleObject: Record<string, any>): ThisType<StyleSheet>
  processObject(...args: [string, Record<string, any>] | [Record<string, any>]) {
    let output: Rule | Root

    if (args.length === 1 && typeof args[0] === 'object') {
      const [styleObject] = args
      const result = toCss(styleObject)
      output = result.root
    } else {
      const [selector, styleObject] = args as [string, Record<string, any>]
      const cssString = toCss(styleObject)
      output = postcss.rule({ selector, nodes: cssString.root.nodes })
    }

    this.context.root.append(output)
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
    const rules = imports.map((n) => `@import '${n}';\n`)
    this.context.root.prepend(...rules)
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
    this.context.root.append(css)
    return this
  }
}
