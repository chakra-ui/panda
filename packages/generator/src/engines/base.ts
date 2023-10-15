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

import { getPatternEngine } from './pattern'

const helpers = { map: mapObject }

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

  const patterns = getPatternEngine(config)

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

  const createSheetRoot = (): Pick<StylesheetContext, 'root' | 'layersRoot' | 'insertLayers'> => {
    const reset = postcss.atRule({ name: 'layer', params: layers.reset, nodes: [] })
    const base = postcss.atRule({ name: 'layer', params: layers.base, nodes: [] })
    const tokens = postcss.atRule({ name: 'layer', params: layers.tokens, nodes: [] })
    const recipes = postcss.atRule({ name: 'layer', params: layers.recipes, nodes: [] })
    const recipes_base = postcss.atRule({ name: 'layer', params: '_base', nodes: [] })
    const recipes_slots = postcss.atRule({ name: 'layer', params: layers.recipes + '.slots', nodes: [] })
    const recipes_slots_base = postcss.atRule({ name: 'layer', params: '_base', nodes: [] })
    const utilities = postcss.atRule({ name: 'layer', params: layers.utilities, nodes: [] })
    const compositions = postcss.atRule({ name: 'layer', params: 'compositions', nodes: [] })
    const root = postcss.root()

    return {
      root,
      layersRoot: {
        reset,
        base,
        tokens,
        recipes,
        recipes_base,
        recipes_slots,
        recipes_slots_base,
        utilities,
        compositions,
      },
      insertLayers: () => {
        console.log('insertLayers')
        if (reset.nodes.length) root.append(reset)
        if (base.nodes.length) root.append(base)
        if (tokens.nodes.length) root.append(tokens)

        if (recipes_base.nodes.length) recipes.prepend(recipes_base)
        if (recipes.nodes.length) root.append(recipes)

        if (recipes_slots_base.nodes.length) recipes_slots.prepend(recipes_slots_base)
        if (recipes_slots.nodes.length) root.append(recipes_slots)

        if (compositions.nodes.length) utilities.append(compositions)
        if (utilities.nodes.length) root.append(utilities)
        return root
      },
    }
  }
  const staticSheetContext: Omit<StylesheetContext, 'root' | 'layersRoot' | 'insertLayers'> = {
    conditions,
    utility,
    hash: hash.className,
    helpers,
    layers,
  }
  const createSheetContext = () => Object.assign(createSheetRoot(), staticSheetContext)

  const createSheet = (options?: Pick<StylesheetOptions, 'content'>) => {
    return new Stylesheet(createSheetContext(), {
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

  // TODO colorPalette ?
  const properties = Array.from(new Set(['css', 'textStyle', ...utility.keys(), ...conditions.keys()]))
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
    // cascade layer
    layers,
    isValidLayerRule,
    layerString,
    layerNames,
  }
}

export interface GeneratorBaseEngine extends ReturnType<typeof getBaseEngine> {}
