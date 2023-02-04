import { assignCompositions, Conditions, Stylesheet, Utility } from '@pandacss/core'
import { isCssProperty } from '@pandacss/is-valid-prop'
import { logger } from '@pandacss/logger'
import { mapObject } from '@pandacss/shared'
import { TokenDictionary } from '@pandacss/token-dictionary'
import type { UserConfig } from '@pandacss/types'
import { Obj, pipe, tap } from 'lil-fp'
import postcss from 'postcss'

const helpers = { map: mapObject }

export const getBaseEngine = (config: UserConfig) =>
  pipe(
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

    Obj.bind('createSheet', ({ conditions, utility, config }) => () => {
      return new Stylesheet({
        root: postcss.root(),
        conditions,
        utility,
        hash: config.hash,
        helpers,
      })
    }),

    Obj.bind('properties', ({ utility, conditions }) =>
      Array.from(new Set(['css', ...utility.keys(), ...conditions.keys()])),
    ),

    Obj.bind('isValidProperty', ({ properties }) => {
      return (key: string) => {
        const regex = new RegExp('^(?:' + properties.join('|') + ')$')
        return regex.test(key) || isCssProperty(key)
      }
    }),
  )
