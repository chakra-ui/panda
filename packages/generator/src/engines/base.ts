import { Conditions, Stylesheet, Utility, assignCompositions, type StylesheetOptions } from '@pandacss/core'
import { isCssProperty } from '@pandacss/is-valid-prop'
import { logger } from '@pandacss/logger'
import { compact, mapObject, memo } from '@pandacss/shared'
import { TokenDictionary } from '@pandacss/token-dictionary'
import type { LoadConfigResult } from '@pandacss/types'
import { Obj, pipe, tap } from 'lil-fp'
import postcss from 'postcss'

const helpers = { map: mapObject }

export const getBaseEngine = (conf: LoadConfigResult) =>
  pipe(
    conf,

    Obj.bind('tokens', ({ config: { theme = {}, prefix } }) => {
      const { breakpoints, tokens, semanticTokens } = theme
      return new TokenDictionary({ breakpoints, tokens, semanticTokens, prefix })
    }),

    tap(({ tokens }) => {
      logger.debug('generator:tokens', tokens.allNames)
    }),

    Obj.bind('utility', ({ config: { prefix, utilities, separator }, tokens }) => {
      return new Utility({ prefix, tokens, config: utilities, separator })
    }),

    Obj.bind('conditions', ({ config: { conditions, theme } }) => {
      const { breakpoints } = theme ?? {}
      return new Conditions({ conditions, breakpoints })
    }),

    tap(({ conditions, utility, config: { theme } }) => {
      logger.debug('generator:conditions', conditions)

      const { textStyles, layerStyles } = theme ?? {}
      const compositions = compact({ textStyle: textStyles, layerStyle: layerStyles })
      assignCompositions({ conditions, utility }, compositions)
    }),

    Obj.bind('createSheet', ({ conditions, utility, config: { hash } }) => (options?: StylesheetOptions) => {
      const context = { root: postcss.root(), conditions, utility, hash, helpers }
      return new Stylesheet(context, options)
    }),

    Obj.bind('properties', ({ utility, conditions }) =>
      Array.from(new Set(['css', ...utility.keys(), ...conditions.keys()])),
    ),

    Obj.bind('isValidProperty', ({ properties }) => {
      const propertyMap = new Map(properties.map((prop) => [prop, true]))
      return memo((key: string) => {
        return propertyMap.has(key) || isCssProperty(key)
      })
    }),
  )
