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
import { compact, mapObject, memo } from '@pandacss/shared'
import { TokenDictionary } from '@pandacss/token-dictionary'
import type { ConfigResultWithHooks } from '@pandacss/types'
import { isBool, isStr } from 'lil-fp'
import postcss from 'postcss'

const helpers = {
  map: mapObject,
}

export const getBaseEngine = (conf: ConfigResultWithHooks) => {
  const { config } = conf
  const theme = config.theme ?? {}

  const hash = {
    tokens: isBool(config.hash) ? config.hash : config.hash?.cssVar,
    className: isBool(config.hash) ? config.hash : config.hash?.className,
  }

  const prefix = {
    tokens: isStr(config.prefix) ? config.prefix : config.prefix?.cssVar,
    className: isStr(config.prefix) ? config.prefix : config.prefix?.className,
  }

  const tokens = new TokenDictionary({
    breakpoints: theme.breakpoints,
    tokens: theme.tokens,
    semanticTokens: theme.semanticTokens,
    prefix: prefix.tokens,
    hash: hash.tokens,
  })

  const utility = new Utility({
    prefix: prefix.className,
    tokens: tokens,
    config: config.utilities,
    separator: config.separator,
  })

  const conditions = new Conditions({
    conditions: config.conditions,
    breakpoints: config.theme?.breakpoints,
  })

  const { textStyles, layerStyles } = theme

  const compositions = compact({
    textStyle: textStyles,
    layerStyle: layerStyles,
  })

  const compositionContext = { conditions, utility }
  assignCompositions(compositions, compositionContext)

  const createSheetContext = (): StylesheetContext => ({
    root: postcss.root(),
    conditions,
    utility,
    hash: hash.className,
    helpers,
  })

  const createSheet = (options?: Pick<StylesheetOptions, 'content'>) => {
    const sheetContext = createSheetContext()
    return new Stylesheet(sheetContext, {
      content: options?.content,
      recipes: theme?.recipes,
    })
  }

  const recipeContext = createSheetContext()
  const recipes = new Recipes(theme?.recipes ?? {}, recipeContext)
  // cache recipes on first run
  recipes.save()

  const properties = Array.from(new Set(['css', ...utility.keys(), ...conditions.keys()]))
  const propertyMap = new Map(properties.map((prop) => [prop, true]))

  const isValidProperty = memo((key: string) => {
    return propertyMap.has(key) || isCssProperty(key)
  })

  return {
    ...conf,
    hash,
    prefix,
    tokens,
    utility,
    properties,
    isValidProperty,
    recipes,
    conditions,
    createSheetContext,
    createSheet,
  }
}
