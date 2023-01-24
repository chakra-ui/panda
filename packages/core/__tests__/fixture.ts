import * as mocks from '@pandacss/fixture'
import { TokenDictionary } from '@pandacss/token-dictionary'
import postcss from 'postcss'
import { Conditions, Utility } from '../src'
import { Recipe } from '../src/recipe'
import type { StylesheetContext } from '../src/types'

export const createContext = ({ hash, prefix }: { hash?: boolean; prefix?: string } = {}): StylesheetContext => {
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
  const recipe = new Recipe(mocks.recipes[key], createContext())
  return recipe.config
}

export function processRecipe(key: 'buttonStyle' | 'textStyle' | 'tooltipStyle', value: Record<string, any>) {
  const recipe = new Recipe(mocks.recipes[key], createContext())
  recipe.process({ styles: value })
  return recipe.toCss()
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
