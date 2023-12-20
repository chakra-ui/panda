import type { SystemStyleObject } from '@pandacss/types'
import { describe, expect, test } from 'vitest'
import { assignCompositions } from '@pandacss/core'
import { createRuleProcessor } from './fixture'
import { createGeneratorContext, fixtureDefaults } from '@pandacss/fixture'

const compositions = { textStyle: fixtureDefaults.config.theme?.textStyles }

function css(styles: SystemStyleObject) {
  const ctx = createGeneratorContext()
  assignCompositions(compositions, ctx)
  return createRuleProcessor().css(styles).toCss()
}

describe('compositions', () => {
  test('should assign composition', () => {
    const ctx = createGeneratorContext()
    assignCompositions(compositions, ctx)
    const result = ctx.utility.transform('textStyle', 'headline.h2')
    expect(result).toMatchInlineSnapshot(`
      {
        "className": "textStyle_headline.h2",
        "layer": "compositions",
        "styles": {
          "&": {
            "@media screen and (min-width: 64em)": {
              "fontSize": "2rem",
            },
          },
          "fontSize": "1.5rem",
          "fontWeight": "var(--font-weights-bold)",
        },
      }
    `)

    expect(ctx.utility.transform('textStyle', 'headline.h5')).toMatchInlineSnapshot(`
    {
      "className": "textStyle_headline.h5",
      "layer": "compositions",
      "styles": {},
    }
    `)
  })

  test('should respect the layer', () => {
    expect(css({ textStyle: 'headline.h1' })).toMatchInlineSnapshot(`
      "@layer utilities {
        @layer compositions {
          .textStyle_headline\\\\.h1 {
            font-size: 2rem;
            font-weight: var(--font-weights-bold)
      }
          }
      }"
    `)

    expect(css({ textStyle: 'headline.h2' })).toMatchInlineSnapshot(`
      "@layer utilities {
        @layer compositions {
          .textStyle_headline\\\\.h2 {
            font-size: 1.5rem;
            font-weight: var(--font-weights-bold);
      }

          @media screen and (min-width: 64em) {
            .textStyle_headline\\\\.h2 {
              font-size: 2rem;
          }
      }
          }
      }"
    `)
  })
})
