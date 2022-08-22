import { Stylesheet, GeneratorContext } from '@css-panda/atomic'
import { CSSUtility, mergeUtilities } from '@css-panda/css-utility'
import { Dictionary } from '@css-panda/dictionary'
import postcss from 'postcss'

export function createContext(config: any) {
  const dictionary = new Dictionary({
    tokens: config.tokens,
    semanticTokens: config.semanticTokens,
    prefix: config.prefix,
  })

  const utilities = new CSSUtility({
    tokens: dictionary,
    config: mergeUtilities(config.utilities),
  })

  const context = (): GeneratorContext => ({
    root: postcss.root(),
    breakpoints: config.breakpoints ?? {},
    conditions: config.conditions ?? {},
    transform(prop, value) {
      return utilities.resolve(prop, value)
    },
  })

  const stylesheet = new Stylesheet(context())

  return {
    config,
    dictionary,
    context,
    stylesheet,
    utilities,
  }
}

export type InternalContext = ReturnType<typeof createContext>
