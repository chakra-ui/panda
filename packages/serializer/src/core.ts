import { assignCompositions, Conditions, Stylesheet, Utility } from '@pandacss/core'
import { isCssProperty } from '@pandacss/is-valid-prop'
import { logger } from '@pandacss/logger'
import { mapObject } from '@pandacss/shared'
import { TokenDictionary } from '@pandacss/token-dictionary'
import type { LoadConfigResult } from '@pandacss/types'
import { Obj, pipe, tap } from 'lil-fp'
import postcss from 'postcss'

export const core = (conf: LoadConfigResult) => {
  const { config } = conf
  return pipe(
    { config },

    Obj.bind('tokens', ({ config: { theme, prefix } }) => {
      const { breakpoints, tokens, semanticTokens } = theme ?? {}
      return new TokenDictionary({
        breakpoints,
        tokens,
        semanticTokens,
        prefix,
      })
    }),

    tap(({ tokens }) => {
      logger.debug('serialize:tokens', tokens.allNames)
    }),

    Obj.bind('utility', ({ config: { prefix, utilities, separator }, tokens }) => {
      return new Utility({
        prefix,
        tokens,
        config: utilities,
        separator,
      })
    }),

    Obj.bind('conditions', ({ config: { conditions, theme } }) => {
      const { breakpoints } = theme ?? {}
      return new Conditions({
        conditions,
        breakpoints,
      })
    }),

    tap(({ conditions, utility, config: { theme } }) => {
      const { textStyles, layerStyles } = theme ?? {}
      const compositions = { textStyles, layerStyles }
      assignCompositions({ conditions, utility }, compositions)
    }),

    Obj.bind('createContext', ({ utility, conditions, config: { hash } }) => () => ({
      root: postcss.root(),
      conditions,
      utility,
      hash,
      helpers: { map: mapObject },
    })),

    Obj.bind('createSheet', ({ createContext }) => {
      return new Stylesheet(createContext())
    }),

    Obj.bind('properties', ({ utility, conditions }) => {
      return Array.from(new Set(['css', ...utility.keys(), ...conditions.keys()]))
    }),

    Obj.bind('isValidProperty', ({ properties }) => {
      return (prop: string) => {
        const regex = new RegExp('^(?:' + properties.join('|') + ')$')
        return regex.test(prop) || isCssProperty(prop)
      }
    }),
  )
}
