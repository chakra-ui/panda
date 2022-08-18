import { AtomicRuleset } from './atomic-ruleset'
import { expandScreenAtRule } from './expand-screen'
import { GeneratorContext } from './types'
import { optimizeCss, OptimizeOptions } from './optimize'

export class AtomicStylesheet {
  constructor(private context: GeneratorContext) {}

  process(properties: Record<string, any>, { hash }: { hash?: boolean } = {}) {
    const { selectors = {}, '@media': mediaQueries = {}, ...styles } = properties

    const inner = (props: any, scope?: string) => {
      const ruleset = new AtomicRuleset(this.context)
      ruleset.process({ scope, styles: props, hash })
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

  toCss(options: OptimizeOptions = {}) {
    expandScreenAtRule(this.context.root, this.context.breakpoints)
    const { code } = optimizeCss(this.context.root.toString(), options)
    return code
  }

  reset() {
    this.context.root.removeAll()
  }
}
