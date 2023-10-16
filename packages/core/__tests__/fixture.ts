import * as mocks from '@pandacss/fixture'
import { TokenDictionary } from '@pandacss/token-dictionary'
import postcss from 'postcss'
import { Conditions, Utility, Recipes } from '../src'
import type { StylesheetContext } from '../src/types'

type ContextOptions = {
  hash?: boolean
  prefix?: string
}

const defaultLayers = {
  reset: 'reset',
  base: 'base',
  tokens: 'tokens',
  recipes: 'recipes',
  utilities: 'utilities',
}

const createSheetRoot = (): Pick<StylesheetContext, 'root' | 'layers'> => {
  const reset = postcss.atRule({ name: 'layer', params: 'reset', nodes: [] })
  const base = postcss.atRule({ name: 'layer', params: 'base', nodes: [] })
  const tokens = postcss.atRule({ name: 'layer', params: 'tokens', nodes: [] })
  const recipes = postcss.atRule({ name: 'layer', params: 'recipes', nodes: [] })
  const recipes_base = postcss.atRule({ name: 'layer', params: '_base', nodes: [] })
  const recipes_slots = postcss.atRule({ name: 'layer', params: 'recipes.slots', nodes: [] })
  const recipes_slots_base = postcss.atRule({ name: 'layer', params: '_base', nodes: [] })
  const utilities = postcss.atRule({ name: 'layer', params: 'utilities', nodes: [] })
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

        if (compositions.nodes.length) utilities.append(compositions)
        if (utilities.nodes.length) root.append(utilities)
        return root
      },
    },
  }
}

export const createContext = ({ hash, prefix }: ContextOptions = {}): StylesheetContext => {
  const conditions = new Conditions({
    conditions: mocks.conditions,
    breakpoints: mocks.breakpoints,
  })

  const tokens = new TokenDictionary({
    tokens: mocks.tokens,
    semanticTokens: mocks.semanticTokens,
    prefix,
  })

  const utility = new Utility({
    config: mocks.utilities,
    tokens,
    prefix,
    shorthands: true,
  })

  return {
    ...createSheetRoot(),
    hash,
    root: postcss.root(),
    conditions: conditions,
    utility: utility,
    helpers: { map: () => '' },
    layersNames: defaultLayers,
  }
}

export function getRecipe(key: 'buttonStyle' | 'textStyle' | 'tooltipStyle') {
  const { conditions, utility } = createContext()
  const recipes = new Recipes({ recipes: mocks.recipes, conditions, utility })
  recipes.save()

  const recipe = recipes.getRecipe(key)
  return recipe!.config
}

export function processRecipe(recipe: 'buttonStyle' | 'textStyle' | 'tooltipStyle', value: Record<string, any>) {
  const { conditions, utility } = createContext()
  const recipes = new Recipes({ recipes: mocks.recipes, conditions, utility })
  recipes.save()

  recipes.process(recipe, { styles: value })
  return recipes.toCss()
}

export function processSlotRecipe(recipe: 'button', value: Record<string, any>) {
  const { conditions, utility } = createContext()
  const recipes = new Recipes({ recipes: mocks.slotRecipes, conditions, utility })
  recipes.save()

  recipes.process(recipe, { styles: value })
  return recipes
}

export const compositions = {
  textStyle: {
    headline: {
      h1: {
        value: {
          fontSize: '2rem',
          fontWeight: 'bold',
        },
      },
      h2: {
        value: {
          fontSize: { base: '1.5rem', lg: '2rem' },
          fontWeight: 'bold',
        },
      },
    },
  },
}
