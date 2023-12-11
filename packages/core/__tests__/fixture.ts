import * as mocks from '@pandacss/fixture'
import { TokenDictionary } from '@pandacss/token-dictionary'
import type { Dict } from '@pandacss/types'
import { Conditions, Layers, Recipes, Utility } from '../src'
import { createAtomicRule } from '../src/atomic-rule'
import type { StylesheetContext } from '../src/types'

type ContextOptions = Partial<Omit<StylesheetContext, 'recipes'>> & { prefix?: string; recipes?: Dict }

export const createContext = (opts: ContextOptions = {}): StylesheetContext => {
  const { hash, prefix, recipes: recipeObj = {}, ...rest } = opts

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

  const layers = new Layers(mocks.layers)

  const recipes = new Recipes(recipeObj, {
    utility,
    conditions,
    layers,
  })

  return {
    layers,
    hash,
    recipes,
    conditions,
    utility,
    helpers: { map: () => '' },
    ...rest,
  }
}

export const createCssFn =
  (opts: ContextOptions = {}) =>
  (styles: Dict) => {
    const ctx = createContext(opts)
    const rule = createAtomicRule(ctx)
    rule.process({ styles: rule.normalize(styles) })
    return ctx.layers.insert().toString()
  }

export const createRecipeFn =
  (opts: ContextOptions = {}) =>
  (recipe: string, styles: Dict) => {
    const ctx = createContext(opts)
    ctx.recipes.process(recipe, { styles })
    return ctx.layers.insert().toString()
  }

export function getRecipe(key: 'buttonStyle' | 'textStyle' | 'tooltipStyle' | 'cardStyle') {
  const ctx = createContext()
  const recipes = new Recipes(mocks.recipes, ctx)
  return recipes.getRecipe(key)!
}

export function getSlotRecipe(key: 'button') {
  const ctx = createContext()
  const recipes = new Recipes(mocks.slotRecipes, ctx)
  return recipes.getRecipe(key)!
}

export function processRecipe(
  recipe: 'buttonStyle' | 'textStyle' | 'tooltipStyle' | 'cardStyle',
  styles: Record<string, any>,
) {
  const recipeFn = createRecipeFn({ recipes: mocks.recipes })
  return recipeFn(recipe, styles)
}

export function processSlotRecipe(recipe: 'button', styles: Record<string, any>) {
  const recipeFn = createRecipeFn({ recipes: mocks.slotRecipes })
  return recipeFn(recipe, styles)
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
