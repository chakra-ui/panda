import * as mocks from '@pandacss/fixture'
import { TokenDictionary } from '@pandacss/token-dictionary'
import postcss from 'postcss'
import { describe, expect, test } from 'vitest'
import { Conditions, Utility } from '../src'
import { AtomicRule, type ProcessOptions } from '../src/atomic-rule'
import type { StylesheetContext } from '../src/types'

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

export const createContext = (): StylesheetContext => ({
  root: postcss.root(),
  conditions: conditions,
  utility: utility,
  helpers: { map: () => '' },
})

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
                  @media screen and (min-width: 30em) {
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
