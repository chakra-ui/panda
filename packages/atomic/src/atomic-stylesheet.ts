import { AtomicRuleset } from './atomic-ruleset'
import { GeneratorContext } from './types'

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

  toCss() {
    return this.context.root.toString()
  }
}
