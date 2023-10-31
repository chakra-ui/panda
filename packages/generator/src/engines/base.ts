import { Conditions, Recipes, Stylesheet, Utility, assignCompositions, type StylesheetContext } from '@pandacss/core'
import { isCssProperty } from '@pandacss/is-valid-prop'
import { compact, mapObject, memo } from '@pandacss/shared'
import { TokenDictionary } from '@pandacss/token-dictionary'
import type {
  CascadeLayers,
  ConfigResultWithHooks,
  HashOptions,
  PrefixOptions,
  RequiredBy,
  TSConfig as _TSConfig,
} from '@pandacss/types'
import { isBool, isStr } from 'lil-fp'
import postcss from 'postcss'

import { getPatternEngine, type PandaPatternEngine } from './pattern'

const helpers = { map: mapObject }

export const getBaseEngine = (conf: ConfigResultWithHooks): PandaBaseEngine => {
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

  const compositions = compact({ textStyle: theme.textStyles, layerStyle: theme.layerStyles })
  const compositionContext = { conditions, utility }
  assignCompositions(compositions, compositionContext)

  const recipes = new Recipes({
    recipes: Object.assign({}, theme.recipes, theme.slotRecipes),
    utility,
    conditions,
  })
  // cache recipes on first run
  recipes.save()

  const patterns = getPatternEngine(config)

  const layersNames = config.layers as CascadeLayers
  const layerList = Object.values(layersNames)

  const isValidLayerRule = memo((layerRule: string) => {
    const names = new Set(layerRule.split(',').map((name) => name.trim()))
    return names.size >= 5 && layerList.every((name) => names.has(name))
  })

  const layerString = `@layer ${layerList.join(', ')};`
  const layers = {
    name: layersNames,
    list: layerList,
    rule: layerString,
    isValidLayerRule,
  }

  const createSheetRoot = (): Pick<StylesheetContext, 'root' | 'layers'> => {
    const reset = postcss.atRule({ name: 'layer', params: layersNames.reset, nodes: [] })
    const base = postcss.atRule({ name: 'layer', params: layersNames.base, nodes: [] })
    const tokens = postcss.atRule({ name: 'layer', params: layersNames.tokens, nodes: [] })
    const recipes = postcss.atRule({ name: 'layer', params: layersNames.recipes, nodes: [] })
    const recipes_base = postcss.atRule({ name: 'layer', params: '_base', nodes: [] })
    const recipes_slots = postcss.atRule({ name: 'layer', params: layersNames.recipes + '.slots', nodes: [] })
    const recipes_slots_base = postcss.atRule({ name: 'layer', params: '_base', nodes: [] })
    const utilities = postcss.atRule({ name: 'layer', params: layersNames.utilities, nodes: [] })
    const compositions = postcss.atRule({ name: 'layer', params: 'compositions', nodes: [] })
    const root = postcss.root()

    return {
      root,
      layers: {
        reset,
        base,
        tokens,
        recipes,
        recipes_base,
        recipes_slots,
        recipes_slots_base,
        utilities,
        compositions,
        insert: () => {
          if (reset.nodes.length) root.append(reset)
          if (base.nodes.length) root.append(base)
          if (tokens.nodes.length) root.append(tokens)

          if (recipes_base.nodes.length) recipes.prepend(recipes_base)
          if (recipes.nodes.length) root.append(recipes)

          if (recipes_slots_base.nodes.length) recipes_slots.prepend(recipes_slots_base)
          if (recipes_slots.nodes.length) root.append(recipes_slots)

          if (compositions.nodes.length) utilities.prepend(compositions)
          if (utilities.nodes.length) root.append(utilities)
          return root
        },
      },
    }
  }

  const staticSheetContext: Omit<StylesheetContext, 'root' | 'layers'> = {
    conditions,
    utility,
    helpers,
    hash: hash.className,
    layersNames,
  }
  const createSheetContext = () => Object.assign(createSheetRoot(), staticSheetContext)
  const createSheet = () => new Stylesheet(createSheetContext())

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
    patterns,
    createSheetContext,
    createSheet,
    layers,
  }
}

export interface PandaBaseEngine extends ConfigResultWithHooks {
  isTemplateLiteralSyntax: boolean
  studio: RequiredBy<NonNullable<ConfigResultWithHooks['config']['studio']>, 'outdir'>
  hash: HashOptions
  prefix: PrefixOptions
  tokens: TokenDictionary
  utility: Utility
  properties: string[]
  isValidProperty: (key: string) => boolean
  recipes: Recipes
  patterns: PandaPatternEngine
  conditions: Conditions
  createSheetContext: () => StylesheetContext
  createSheet: () => Stylesheet
  // cascade layer
  layers: {
    name: CascadeLayers
    list: string[]
    rule: string
    isValidLayerRule: (layerRule: string) => boolean
  }
}
