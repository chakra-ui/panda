import * as mocks from '@pandacss/fixture'
import { TokenDictionary } from '@pandacss/token-dictionary'
import postcss from 'postcss'
import { describe, expect, test } from 'vitest'
import { Conditions, Utility } from '../src'
import { AtomicRule, type ProcessOptions } from '../src/atomic-rule'
import type { StylesheetContext } from '../src/types'
import { defaultLayers } from './fixture'

const conditions = new Conditions({
  breakpoints: mocks.breakpoints,
  conditions: {
    hover: '&[data-hover], &:hover',
    dark: "&[data-theme='dark'], &&[data-theme='dark']",
  },
})

const tokens = new TokenDictionary({
  tokens: mocks.tokens,
  semanticTokens: mocks.semanticTokens,
})

const utility = new Utility({
  config: mocks.utilities,
  tokens,
})

const createSheetRoot = (): Pick<StylesheetContext, 'root' | 'layersRoot' | 'insertLayers'> => {
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
    layersRoot: {
      reset,
      base,
      tokens,
      recipes,
      recipes_base,
      recipes_slots,
      recipes_slots_base,
      utilities,
      compositions,
    },
    insertLayers: () => {
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
  }
}

export const createContext = (): StylesheetContext => {
  return {
    ...createSheetRoot(),
    conditions: conditions,
    utility: utility,
    helpers: { map: () => '' },
    layers: defaultLayers,
  }
}

function css(obj: ProcessOptions) {
  const ruleset = new AtomicRule(createContext())
  ruleset.process(obj)
  return ruleset.toCss()
}

describe('complex-rule', () => {
  test('should process complex rule', () => {
    expect(
      css({
        styles: {
          color: {
            _dark: { base: 'green500', sm: { md: 'red200' } },
          },
        },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
          .dark\\\\:text_green500 {
              &[data-theme='dark'], &&[data-theme='dark'] {
                  color: green500
              }
          }
          .dark\\\\:sm\\\\:md\\\\:text_red200 {
              &[data-theme='dark'], &&[data-theme='dark'] {
                  @media screen and (min-width: 40em) {
                      @media screen and (min-width: 48em) {
                          color: red200
                      }
                  }
              }
          }
      }"
    `)
  })
})
