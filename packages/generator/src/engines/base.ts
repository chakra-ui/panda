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
import type { CascadeLayers, ConfigResultWithHooks, TSConfig as _TSConfig } from '@pandacss/types'
import { isBool, isStr } from 'lil-fp'
import postcss from 'postcss'

const helpers = {
  map: mapObject,
}

export const getBaseEngine = (conf: ConfigResultWithHooks) => {
  const { config } = conf
  const theme = config.theme ?? {}

  const isTemplateLiteralSyntax = config.syntax === 'template-literal'

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
    config: isTemplateLiteralSyntax ? {} : config.utilities,
    separator: config.separator,
    shorthands: config.shorthands,
    strictTokens: config.strictTokens,
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

  const layers = config.layers as CascadeLayers
  const layerNames = Object.values(layers)

  const isValidLayerRule = memo((layerRule: string) => {
    const names = new Set(layerRule.split(',').map((name) => name.trim()))
    return names.size >= 5 && layerNames.every((name) => names.has(name))
  })

  const layerString = `@layer ${layerNames.join(', ')};`

  const createSheetContext = (): StylesheetContext => ({
    root: postcss.root(),
    conditions,
    utility,
    hash: hash.className,
    helpers,
    layers,
  })

  const createSheet = (options?: Pick<StylesheetOptions, 'content'>) => {
    const sheetContext = createSheetContext()
    return new Stylesheet(sheetContext, {
      content: options?.content,
      recipes: theme?.recipes,
      slotRecipes: theme?.slotRecipes,
    })
  }

  const recipeContext = createSheetContext()
  const recipeConfigs = Object.assign({}, theme.recipes ?? {}, theme.slotRecipes ?? {})
  const recipes = new Recipes(recipeConfigs, recipeContext)
  // cache recipes on first run
  recipes.save()

  const properties = Array.from(new Set(['css', ...utility.keys(), ...conditions.keys()]))
  const propertyMap = new Map(properties.map((prop) => [prop, true]))

  const isValidProperty = memo((key: string) => {
    return propertyMap.has(key) || isCssProperty(key)
  })

  const studio = {
    outdir: `${config.outdir}-studio`,
    ...conf.config.studio,
  }

  return {
    ...conf,
    isTemplateLiteralSyntax,
    studio,
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
    // cascade layer
    layers,
    isValidLayerRule,
    layerString,
    layerNames,
  }
}
