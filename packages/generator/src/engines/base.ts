import {
  Conditions,
  Recipes,
  Stylesheet,
  Utility,
  assignCompositions,
  type StylesheetContext,
  type StylesheetOptions,
} from '@pandacss/core'
import { isCssProperty } from '@pandacss/is-valid-prop'
import { logger } from '@pandacss/logger'
import { compact, mapObject, memo } from '@pandacss/shared'
import { TokenDictionary } from '@pandacss/token-dictionary'
import type { LoadConfigResult } from '@pandacss/types'
import { Obj, isBool, isStr, pipe, tap } from 'lil-fp'
import postcss from 'postcss'

const helpers = { map: mapObject }

export const getBaseEngine = (conf: LoadConfigResult) =>
  pipe(
    conf,

    Obj.bind('configDependencies', ({ dependencies }) => dependencies ?? []),

    Obj.assign(({ config: { hash, prefix } }) => ({
      hash: {
        tokens: isBool(hash) ? hash : hash?.cssVar,
        className: isBool(hash) ? hash : hash?.className,
      },
      prefix: {
        tokens: isStr(prefix) ? prefix : prefix?.cssVar,
        className: isStr(prefix) ? prefix : prefix?.className,
      },
    })),

    Obj.bind('tokens', ({ hash, prefix, config: { theme = {} } }) => {
      const { breakpoints, tokens, semanticTokens } = theme
      return new TokenDictionary({
        breakpoints,
        tokens,
        semanticTokens,
        prefix: prefix.tokens,
        hash: hash.tokens,
      })
    }),

    tap(({ tokens }) => {
      logger.debug('generator:tokens', tokens.allNames)
    }),

    Obj.bind('utility', ({ config: { utilities, separator }, tokens, prefix }) => {
      return new Utility({
        prefix: prefix.className,
        tokens,
        config: utilities,
        separator,
      })
    }),

    Obj.bind('conditions', ({ config: { conditions, theme } }) => {
      const { breakpoints } = theme ?? {}
      return new Conditions({ conditions, breakpoints })
    }),

    tap(({ conditions, utility, config: { theme } }) => {
      const { textStyles, layerStyles } = theme ?? {}
      const compositions = compact({ textStyle: textStyles, layerStyle: layerStyles })
      assignCompositions({ conditions, utility }, compositions)
    }),

    Obj.bind('createSheetContext', ({ conditions, utility, hash }) => {
      return (): StylesheetContext => ({
        root: postcss.root(),
        conditions,
        utility,
        hash: hash.className,
        helpers,
      })
    }),

    Obj.bind('recipes', ({ config: { theme }, createSheetContext }) => {
      const context = createSheetContext()
      const recipes = new Recipes(theme?.recipes ?? {}, context)
      recipes.save() // cache recipes on first run
      return recipes
    }),

    Obj.bind(
      'createSheet',
      ({ config: { theme }, createSheetContext }) =>
        (options?: Pick<StylesheetOptions, 'content'>) => {
          const context = createSheetContext()
          return new Stylesheet(context, {
            content: options?.content,
            recipes: theme?.recipes,
          })
        },
    ),

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
