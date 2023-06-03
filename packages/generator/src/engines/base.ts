import { Conditions, Recipes, Stylesheet, Utility, assignCompositions, type StylesheetOptions } from '@pandacss/core'
import { isCssProperty } from '@pandacss/is-valid-prop'
import { logger } from '@pandacss/logger'
import { compact, mapObject, memo } from '@pandacss/shared'
import { TokenDictionary } from '@pandacss/token-dictionary'
import type { LoadConfigResult } from '@pandacss/types'
import postcss from 'postcss'

const helpers = { map: mapObject }

export const getBaseEngine = (conf: LoadConfigResult) => {
  const { config } = conf
  const { theme = {}, prefix, hash } = config
  const { breakpoints, semanticTokens } = theme

  const tokens = new TokenDictionary({ breakpoints, tokens: theme.tokens, semanticTokens, prefix, hash })
  const utility = new Utility({ prefix, tokens, config: config.utilities })
  const conditions = new Conditions({ conditions: config.conditions, breakpoints })

  const context = { root: postcss.root(), conditions, utility, hash, helpers }
  const recipes = new Recipes(theme?.recipes, context)
  recipes.save() // cache recipes on first run

  logger.debug('generator:tokens', tokens.allNames)

  const { textStyles, layerStyles } = theme ?? {}
  const compositions = compact({ textStyle: textStyles, layerStyle: layerStyles })
  assignCompositions({ conditions, utility }, compositions)

  const createSheet = (options?: Pick<StylesheetOptions, 'content'>) => {
    const context = { root: postcss.root(), conditions, utility, hash, helpers }
    return new Stylesheet(context, {
      content: options?.content,
      recipes: theme?.recipes,
    })
  }

  const properties = Array.from(new Set(['css', ...utility.keys(), ...conditions.keys()]))
  const propertyMap = new Map(properties.map((prop) => [prop, true]))
  const isValidProperty = memo((key: string) => {
    return propertyMap.has(key) || isCssProperty(key)
  })

  return Object.assign(conf, {
    configDependencies: conf.dependencies ?? [],
    tokens,
    utility,
    conditions,
    recipes,
    createSheet,
    properties,
    isValidProperty,
  })
}
