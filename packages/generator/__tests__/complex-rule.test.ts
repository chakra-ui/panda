import type { SystemStyleObject } from '@pandacss/types'
import { describe, expect, test } from 'vitest'
import { createRuleProcessor } from './fixture'

const css = ({ styles }: { styles: SystemStyleObject }) => {
  return createRuleProcessor().css(styles).toCss()
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
