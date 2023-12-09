import type { CascadeLayer, CascadeLayers } from '@pandacss/types'
import postcss, { AtRule, Root } from 'postcss'

export class Layers {
  root: Root
  reset: AtRule
  base: AtRule
  tokens: AtRule
  recipes: { root: AtRule; base: AtRule }
  slotRecipes: { root: AtRule; base: AtRule }

  utilities: { root: AtRule; compositions: AtRule; custom(layer: string): AtRule }
  private utilityRuleMap = new Map<string, AtRule>()

  constructor(private names: CascadeLayers) {
    // root
    this.root = postcss.root()

    // @layer reset
    this.reset = postcss.atRule({ name: 'layer', params: names.reset, nodes: [] })

    // @layer base
    this.base = postcss.atRule({ name: 'layer', params: names.base, nodes: [] })

    // @layer tokens
    this.tokens = postcss.atRule({ name: 'layer', params: names.tokens, nodes: [] })

    // @layer recipes
    this.recipes = {
      root: postcss.atRule({ name: 'layer', params: names.recipes, nodes: [] }),
      base: postcss.atRule({ name: 'layer', params: '_base', nodes: [] }),
    }

    // @layer recipes.slots
    this.slotRecipes = {
      root: postcss.atRule({ name: 'layer', params: names.recipes + '.slots', nodes: [] }),
      base: postcss.atRule({ name: 'layer', params: '_base', nodes: [] }),
    }

    // @layer utilities
    this.utilities = {
      root: postcss.atRule({ name: 'layer', params: names.utilities, nodes: [] }),
      compositions: postcss.atRule({ name: 'layer', params: 'compositions', nodes: [] }),
      custom: (layer: string) => {
        if (!this.utilityRuleMap.has(layer)) {
          const atRule = postcss.atRule({ name: 'layer', params: layer, nodes: [] })
          this.utilityRuleMap.set(layer, atRule)
        }
        return this.utilityRuleMap.get(layer) as AtRule
      },
    }
  }

  getLayer(layer: CascadeLayer) {
    // inset in order: reset, base, tokens, recipes, utilities
    const { reset, base, tokens, recipes, slotRecipes, utilities } = this

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

        if (recipes.base.nodes.length) recipes.root.prepend(recipes.base)
        if (slotRecipes.base.nodes.length) slotRecipes.root.prepend(slotRecipes.base)

        if (recipes.root.nodes.length) recipeRoot.append(recipes.root)
        if (slotRecipes.root.nodes.length) recipeRoot.append(slotRecipes.root)
        return recipeRoot
      }

      case 'utilities': {
        if (utilities.compositions.nodes.length) utilities.root.prepend(utilities.compositions)
        this.utilityRuleMap.forEach((rules) => {
          if (rules.nodes.length) utilities.root.append(rules)
        })
        return utilities.root
      }

      default:
        throw new Error(`Unknown layer: ${layer}`)
    }
  }

  insert() {
    const { root } = this

    const reset = this.getLayer('reset')
    if (reset.nodes.length) root.append(reset)

    const base = this.getLayer('base')
    if (base.nodes.length) root.append(base)

    const tokens = this.getLayer('tokens')
    if (tokens.nodes.length) root.append(tokens)

    const recipes = this.getLayer('recipes')
    if (recipes.nodes.length) root.append(recipes)

    const utilities = this.getLayer('utilities')
    if (utilities.nodes.length) root.append(utilities)

    return root
  }

  clean() {
    this.root.removeAll()
  }

  get layerNames() {
    return Object.values(this.names)
  }

  isValidParams(params: string) {
    const names = new Set(params.split(',').map((name) => name.trim()))
    return names.size >= 5 && this.layerNames.every((name) => names.has(name))
  }

  get params() {
    return `@layer ${this.layerNames.join(', ')};`
  }
}
