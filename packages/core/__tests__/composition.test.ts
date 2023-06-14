import { describe, expect, test } from 'vitest'
import { assignCompositions } from '../src/compositions'
import { compositions, createContext } from './fixture'
import { AtomicRule, type ProcessOptions } from '../src/atomic-rule'

function css(obj: ProcessOptions) {
  const ctx = createContext()
  assignCompositions(compositions, ctx)
  const ruleset = new AtomicRule(ctx)
  ruleset.process(obj)
  return ruleset.toCss()
}

describe('compositions', () => {
  test('should assign composition', () => {
    const ctx = createContext()
    assignCompositions(compositions, ctx)
    const result = ctx.utility.transform('textStyle', 'headline.h2')
    expect(result).toMatchInlineSnapshot(`
      {
        "className": "textStyle_headline.h2",
        "layer": "compositions",
        "styles": {
          "&": {
            "@media screen and (min-width: 1024px)": {
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
    expect(css({ styles: { textStyle: 'headline.h1' } })).toMatchInlineSnapshot(`
      "@layer utilities {
          @layer compositions {
              .textStyle_headline\\\\.h1 {
                  font-size: 2rem;
                  font-weight: var(--font-weights-bold)
              }
          }
      }"
    `)

    expect(css({ styles: { textStyle: 'headline.h2' } })).toMatchInlineSnapshot(`
      "@layer utilities {
          @layer compositions {
              .textStyle_headline\\\\.h2 {
                  font-size: 1.5rem;
                  @media screen and (min-width: 1024px) {
                      & {
                          font-size: 2rem
                      }
                  }
                  font-weight: var(--font-weights-bold)
              }
          }
      }"
    `)
  })
})
