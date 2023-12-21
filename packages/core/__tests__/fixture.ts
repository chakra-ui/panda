import * as mocks from '@pandacss/fixture'
import type { Config, Dict } from '@pandacss/types'
import { Recipes } from '../src'
import { createAtomicRule } from '../src/atomic-rule'
import type { StylesheetContext } from '../src/types'
import { createContext, createGeneratorContext } from '@pandacss/fixture'

export const createCssFn =
  (opts: Config = {}) =>
  (styles: Dict) => {
    const ctx = createContext(opts)
    const rule = createAtomicRule(ctx)
    rule.process({ styles: rule.normalize(styles) })
    return ctx.layers.insert().toString()
  }

export const createRecipeFn =
  (opts: Config = {}) =>
  (recipe: string, styles: Dict) => {
    const ctx = createContext(opts)
    ctx.recipes.process(recipe, { styles })
    return ctx.layers.insert().toString()
  }

export function getRecipe(key: 'buttonStyle' | 'textStyle' | 'tooltipStyle' | 'cardStyle') {
  const ctx = createContext()
  return ctx.recipes.getRecipe(key)!
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
