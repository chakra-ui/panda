import postcss, { AtRule } from 'postcss'
import type { StylesheetRoot } from './types'
import type { CascadeLayers } from '@pandacss/types'

export function createSheetRoot(layers: CascadeLayers): StylesheetRoot {
  // @layer reset
  const reset = postcss.atRule({ name: 'layer', params: layers.reset, nodes: [] })

  // @layer base
  const base = postcss.atRule({ name: 'layer', params: layers.base, nodes: [] })

  // @layer tokens
  const tokens = postcss.atRule({ name: 'layer', params: layers.tokens, nodes: [] })

  // @layer recipes
  const recipes = {
    root: postcss.atRule({ name: 'layer', params: layers.recipes, nodes: [] }),
    base: postcss.atRule({ name: 'layer', params: '_base', nodes: [] }),
  }
  const slotRecipes = {
    root: postcss.atRule({ name: 'layer', params: layers.recipes + '.slots', nodes: [] }),
    base: postcss.atRule({ name: 'layer', params: '_base', nodes: [] }),
  }

  const customRules = new Map<string, AtRule>()

  // @layer utilities
  const utilities = {
    root: postcss.atRule({ name: 'layer', params: layers.utilities, nodes: [] }),
    compositions: postcss.atRule({ name: 'layer', params: 'compositions', nodes: [] }),
    custom(layer: string) {
      if (!customRules.has(layer)) {
        const atRule = postcss.atRule({ name: 'layer', params: layer, nodes: [] })
        customRules.set(layer, atRule)
      }
      return customRules.get(layer) as AtRule
    },
  }

  // root
  const root = postcss.root()

  return {
    root,
    layers: {
      reset,
      base,
      tokens,
      recipes,
      slotRecipes,
      utilities,
    },
    insertLayers() {
      if (reset.nodes.length) root.append(reset)
      if (base.nodes.length) root.append(base)
      if (tokens.nodes.length) root.append(tokens)

      if (recipes.base.nodes.length) recipes.root.prepend(recipes.base)
      if (recipes.root.nodes.length) root.append(recipes.root)

      if (slotRecipes.base.nodes.length) slotRecipes.root.prepend(slotRecipes.base)
      if (slotRecipes.root.nodes.length) root.append(slotRecipes.root)

      if (utilities.compositions.nodes.length) utilities.root.prepend(utilities.compositions)
      customRules.forEach((rules) => {
        if (rules.nodes.length) utilities.root.append(rules)
      })
      if (utilities.root.nodes.length) root.append(utilities.root)

      return root
    },
  }
}
