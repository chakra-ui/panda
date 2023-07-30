import * as mocks from '@pandacss/fixture'
import { TokenDictionary } from '@pandacss/token-dictionary'
import postcss from 'postcss'
import { Conditions, Utility, Recipes } from '../src'
import type { StylesheetContext } from '../src/types'

type ContextOptions = {
  hash?: boolean
  prefix?: string
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
    hash,
    root: postcss.root(),
    conditions: conditions,
    utility: utility,
    helpers: { map: () => '' },
  }
}

export function getRecipe(key: 'buttonStyle' | 'textStyle' | 'tooltipStyle') {
  const recipes = new Recipes(mocks.recipes, createContext())
  recipes.save()
  const recipe = recipes.getRecipe(key)
  return recipe!.config
}

export function processRecipe(recipe: 'buttonStyle' | 'textStyle' | 'tooltipStyle', value: Record<string, any>) {
  const recipes = new Recipes(mocks.recipes, createContext())
  recipes.save()
  recipes.process(recipe, { styles: value })
  return recipes.toCss()
}

export function processSlotRecipe(recipe: 'button', value: Record<string, any>) {
  const recipes = new Recipes(mocks.slotRecipes, createContext())
  recipes.save()
  recipes.process(recipe, { styles: value })
  return recipes.toCss()
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
