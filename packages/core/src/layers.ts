import type { CascadeLayer, CascadeLayers } from '@pandacss/types'
import postcss, { AtRule, Root } from 'postcss'

export class Layers {
  root: Root
  reset: AtRule
  base: AtRule
  tokens: AtRule

  recipes: AtRule
  recipes_base: AtRule

  recipes_slots: AtRule
  recipes_slots_base: AtRule

  utilities: AtRule
  compositions: AtRule
  private utilityRuleMap = new Map<string, AtRule>()

  constructor(private names: CascadeLayers) {
    this.root = postcss.root()
    this.reset = postcss.atRule({ name: 'layer', params: names.reset, nodes: [] })
    this.base = postcss.atRule({ name: 'layer', params: names.base, nodes: [] })
    this.tokens = postcss.atRule({ name: 'layer', params: names.tokens, nodes: [] })
    this.recipes = postcss.atRule({ name: 'layer', params: names.recipes, nodes: [] })
    this.recipes_base = postcss.atRule({ name: 'layer', params: '_base', nodes: [] })
    this.recipes_slots = postcss.atRule({ name: 'layer', params: names.recipes + '.slots', nodes: [] })
    this.recipes_slots_base = postcss.atRule({ name: 'layer', params: '_base', nodes: [] })
    this.utilities = postcss.atRule({ name: 'layer', params: names.utilities, nodes: [] })
    this.compositions = postcss.atRule({ name: 'layer', params: 'compositions', nodes: [] })
  }

  getLayerRoot(layer: CascadeLayer) {
    // inset in order: reset, base, tokens, recipes, utilities
    const { reset, base, tokens, recipes, recipes_base, recipes_slots, recipes_slots_base, utilities, compositions } =
      this

    switch (layer) {
      case 'base':
        return base

      case 'reset':
        return reset

      case 'tokens': {
        return tokens
      }

      case 'recipes': {
        const recipeRoot = postcss.root()

        if (recipes_base.nodes.length) recipes.prepend(recipes_base)
        if (recipes_slots_base.nodes.length) recipes_slots.prepend(recipes_slots_base)

        if (recipes.nodes.length) recipeRoot.append(recipes)
        if (recipes_slots.nodes.length) recipeRoot.append(recipes_slots)
        return recipeRoot
      }

      case 'utilities': {
        if (compositions.nodes.length) utilities.prepend(compositions)
        this.utilityRuleMap.forEach((rules) => {
          if (rules.nodes.length) utilities.append(rules)
        })
        return utilities
      }

      default:
        throw new Error(`Unknown layer: ${layer}`)
    }
  }

  insert() {
    const { root } = this

    const reset = this.getLayerRoot('reset')
    if (reset.nodes.length) root.append(reset)

    const base = this.getLayerRoot('base')
    if (base.nodes.length) root.append(base)

    const tokens = this.getLayerRoot('tokens')
    if (tokens.nodes.length) root.append(tokens)

    const recipes = this.getLayerRoot('recipes')
    if (recipes.nodes.length) root.append(recipes)

    const utilities = this.getLayerRoot('utilities')
    if (utilities.nodes.length) root.append(utilities)

    return root
  }

  get layerNames() {
    return Object.values(this.names)
  }

  get params() {
    return `@layer ${this.layerNames.join(', ')};`
  }
}
