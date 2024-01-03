import type { SystemStyleObject } from '@pandacss/types'
import { describe, expect, test } from 'vitest'
import { createRuleProcessor } from './fixture'

const css = (styles: SystemStyleObject) => {
  return createRuleProcessor().css(styles).toCss()
}
describe('complex-rule', () => {
  test('should process complex rule', () => {
    expect(
      css({
        color: {
          _dark: { base: 'green500', sm: { md: 'red200' } },
        },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
        [data-theme=dark] .dark\\\\:text_green500, .dark .dark\\\\:text_green500, .dark\\\\:text_green500.dark, .dark\\\\:text_green500[data-theme=dark] {
          color: green500
      }

        @media screen and (min-width: 40em) {
          @media screen and (min-width: 48em) {
            [data-theme=dark] .dark\\\\:sm\\\\:md\\\\:text_red200, .dark .dark\\\\:sm\\\\:md\\\\:text_red200, .dark\\\\:sm\\\\:md\\\\:text_red200.dark, .dark\\\\:sm\\\\:md\\\\:text_red200[data-theme=dark] {
              color: red200
              }
          }
      }
      }"
    `)
  })
})
