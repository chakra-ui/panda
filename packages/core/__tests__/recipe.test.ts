import { describe, expect, test } from 'vitest'
import { getRecipe, processRecipe } from './fixture'

describe('recipe ruleset', () => {
  test('should work with basic', () => {
    expect(processRecipe('textStyle', { variant: 'h1' })).toMatchInlineSnapshot(`
      "@layer recipes {
          @layer _base {
              .textStyle {
                  font-family: var(--fonts-mono);
                  & > :not([hidden]) ~ :not([hidden]) {
                      border-inline-start-width: 20px;
                      border-inline-end-width: 0px
                  }
              }
          }
      }"
    `)

    expect(processRecipe('textStyle', {})).toMatchInlineSnapshot(`
      "@layer recipes {
          @layer _base {
              .textStyle {
                  font-family: var(--fonts-mono);
                  & > :not([hidden]) ~ :not([hidden]) {
                      border-inline-start-width: 20px;
                      border-inline-end-width: 0px
                  }
              }
          }
      }"
    `)

    expect(processRecipe('textStyle', { variant: { base: 'h1', md: 'h2' } })).toMatchInlineSnapshot(`
      "@layer recipes {
          @layer _base {
              .textStyle {
                  font-family: var(--fonts-mono);
                  & > :not([hidden]) ~ :not([hidden]) {
                      border-inline-start-width: 20px;
                      border-inline-end-width: 0px
                  }
              }
          }
      }"
    `)
  })

  test('should work with complex selectors', () => {
    expect(processRecipe('tooltipStyle', {})).toMatchInlineSnapshot(`
      "@layer recipes {
          @layer _base {
              .tooltipStyle {
                  &[data-tooltip].dark, .dark &[data-tooltip], & [data-tooltip].dark, .dark & [data-tooltip] {
                      color: red
                  }
              }
          }
      }"
    `)
  })

  test('should process recipe with conditions', () => {
    expect(getRecipe('buttonStyle')).toMatchInlineSnapshot(`
      {
        "base": {
          "alignItems": "center",
          "display": "inline-flex",
          "justifyContent": "center",
        },
        "compoundVariants": [],
        "defaultVariants": {
          "size": "md",
          "variant": "solid",
        },
        "description": "",
        "jsx": [
          "ButtonStyle",
        ],
        "name": "buttonStyle",
        "variants": {
          "size": {
            "md": {
              "height": "3rem",
              "minWidth": "3rem",
              "padding": "0 0.75rem",
            },
            "sm": {
              "height": "2.5rem",
              "minWidth": "2.5rem",
              "padding": "0 0.5rem",
            },
          },
          "variant": {
            "outline": {
              "&": {
                "&:is(:hover, [data-hover])": {
                  "backgroundColor": "blue",
                  "color": "var(--colors-white)",
                },
                "&[data-disabled]": {
                  "backgroundColor": "var(--colors-transparent)",
                  "border": "1px solid gray",
                  "color": "gray",
                },
              },
              "backgroundColor": "var(--colors-transparent)",
              "border": "1px solid blue",
              "color": "blue",
            },
            "solid": {
              "&": {
                "&:is(:hover, [data-hover])": {
                  "backgroundColor": "darkblue",
                },
                "&[data-disabled]": {
                  "backgroundColor": "gray",
                  "color": "var(--colors-black)",
                },
              },
              "backgroundColor": "blue",
              "color": "var(--colors-white)",
            },
          },
        },
      }
    `)

    expect(processRecipe('buttonStyle', { variant: 'solid' })).toMatchInlineSnapshot(`
      "@layer recipes {
          @layer _base {
              .buttonStyle {
                  display: inline-flex;
                  align-items: center;
                  justify-content: center
              }
          }
          .buttonStyle--size_md {
              height: 3rem;
              min-width: 3rem;
              padding: 0 0.75rem
          }
          .buttonStyle--variant_solid {
              background-color: blue;
              color: var(--colors-white);
              &:is(:hover, [data-hover]) {
                  background-color: darkblue
              }
              &[data-disabled] {
                  background-color: gray;
                  color: var(--colors-black)
              }
          }
      }"
    `)

    expect(processRecipe('buttonStyle', { variant: { base: 'solid', lg: 'outline' } })).toMatchInlineSnapshot(`
      "@layer recipes {
          @layer _base {
              .buttonStyle {
                  display: inline-flex;
                  align-items: center;
                  justify-content: center
              }
          }
          .buttonStyle--size_md {
              height: 3rem;
              min-width: 3rem;
              padding: 0 0.75rem
          }
          .buttonStyle--variant_solid {
              background-color: blue;
              color: var(--colors-white);
              &:is(:hover, [data-hover]) {
                  background-color: darkblue
              }
              &[data-disabled] {
                  background-color: gray;
                  color: var(--colors-black)
              }
          }
          .lg\\\\:buttonStyle--variant_outline {
              @media screen and (min-width: 1024px) {
                  background-color: var(--colors-transparent);
                  border: 1px solid blue;
                  color: blue;
                  &:is(:hover, [data-hover]) {
                      background-color: blue;
                      color: var(--colors-white)
                  }
                  &[data-disabled] {
                      background-color: var(--colors-transparent);
                      border: 1px solid gray;
                      color: gray
                  }
              }
          }
      }"
    `)
  })
})
