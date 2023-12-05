import type { CascadeLayers } from '@pandacss/types'
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

  insert() {
    // inset in order: reset, base, tokens, recipes, utilities
    const { root, reset, base, tokens, recipes, slotRecipes, utilities } = this

    if (reset.nodes.length) root.append(reset)
    if (base.nodes.length) root.append(base)
    if (tokens.nodes.length) root.append(tokens)

    if (recipes.base.nodes.length) recipes.root.prepend(recipes.base)
    if (recipes.root.nodes.length) root.append(recipes.root)
    if (slotRecipes.base.nodes.length) slotRecipes.root.prepend(slotRecipes.base)
    if (slotRecipes.root.nodes.length) root.append(slotRecipes.root)

    if (utilities.compositions.nodes.length) utilities.root.prepend(utilities.compositions)
    this.utilityRuleMap.forEach((rules) => {
      if (rules.nodes.length) utilities.root.append(rules)
    })
    if (utilities.root.nodes.length) {
      root.append(utilities.root)
    }

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
