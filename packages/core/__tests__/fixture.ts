import * as mocks from '@css-panda/fixture'
import { withoutSpace } from '@css-panda/shared'
import { TokenDictionary } from '@css-panda/token-dictionary'
import postcss from 'postcss'
import { Conditions, Utility } from '../src'
import { Recipe } from '../src/recipe'
import type { StylesheetContext } from '../src/types'

const propMap = {
  display: 'd',
  height: 'h',
  width: 'w',
  minHeight: 'min-h',
  textAlign: 'ta',
}

const conditions = new Conditions({
  conditions: mocks.conditions,
  breakpoints: mocks.breakpoints,
})

const tokens = new TokenDictionary({
  tokens: mocks.tokens,
  semanticTokens: mocks.semanticTokens,
})

export const createContext = (): StylesheetContext => ({
  root: postcss.root(),
  conditions: conditions,
  breakpoints: mocks.breakpoints,
  utility: new Utility({
    config: mocks.utilities,
    tokens,
  }),
  helpers: {
    map: () => '',
  },
  hasShorthand: true,
  resolveShorthand(prop) {
    return propMap[prop] || prop
  },
  transform: (prop, value) => {
    const key = propMap[prop] ?? prop
    return {
      className: `${key}-${withoutSpace(value)}`,
      styles: { [prop]: value },
    }
  },
})

export function getRecipe(key: 'buttonStyle' | 'textStyle') {
  const recipe = new Recipe(mocks.recipes[key], createContext())
  return recipe.config
}

export function processRecipe(key: 'buttonStyle' | 'textStyle', value: Record<string, any>) {
  const recipe = new Recipe(mocks.recipes[key], createContext())
  recipe.process({ styles: value })
  return recipe.toCss()
}
