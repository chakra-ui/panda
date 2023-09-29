import { describe, expect, test } from 'vitest'
import { getRecipe, processRecipe } from './fixture'

describe('recipe ruleset', () => {
  test('should work with basic', () => {
    expect(processRecipe('textStyle', { size: 'h1' })).toMatchInlineSnapshot(`
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
          .textStyle--size_h1 {
              font-size: 5rem;
              line-height: 1em;
              font-weight: 800
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

    expect(processRecipe('textStyle', { size: { base: 'h1', md: 'h2' } })).toMatchInlineSnapshot(`
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
          .textStyle--size_h1 {
              font-size: 5rem;
              line-height: 1em;
              font-weight: 800
          }
          .md\\\\:textStyle--size_h2 {
              @media screen and (min-width: 48em) {
                  font-size: 3rem;
                  line-height: 1.2em;
                  font-weight: 700;
                  letter-spacing: -0.03em
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
        "className": "buttonStyle",
        "compoundVariants": [],
        "defaultVariants": {
          "size": "md",
          "variant": "solid",
        },
        "description": "",
        "jsx": [
          "ButtonStyle",
        ],
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
              @media screen and (min-width: 64em) {
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

  //

  test('should process recipe with compoundVariants', () => {
    expect(getRecipe('pillStyle')).toMatchInlineSnapshot(`
      {
        "base": {
          "borderRadius": "4px",
          "fontSize": "16px",
          "fontWeight": "var(--font-weights-bold)",
          "padding": "8px 16px",
        },
        "className": "pillStyle",
        "compoundVariants": [
          {
            "color": "primary",
            "css": {
              "border": "2px solid blue",
            },
            "size": "small",
          },
          {
            "color": "secondary",
            "css": {
              "backgroundColor": "lightgray",
              "border": "none",
              "color": "darkgray",
            },
            "disabled": true,
            "size": "large",
          },
          {
            "color": "secondary",
            "css": {
              "fontWeight": "extrabold",
            },
            "size": [
              "small",
              " medium",
            ],
          },
        ],
        "defaultVariants": {},
        "description": "",
        "jsx": [
          "PillStyle",
        ],
        "variants": {
          "color": {
            "primary": {
              "backgroundColor": "blue",
              "color": "var(--colors-white)",
            },
            "secondary": {
              "backgroundColor": "gray",
              "color": "var(--colors-black)",
            },
          },
          "disabled": {
            "true": {
              "cursor": "not-allowed",
              "opacity": 0.5,
            },
          },
          "size": {
            "large": {
              "fontSize": "18px",
              "padding": "12px 24px",
            },
            "medium": {
              "fontSize": "16px",
              "padding": "8px 16px",
            },
            "small": {
              "fontSize": "14px",
              "padding": "4px 8px",
            },
          },
        },
      }
    `)

    expect(processRecipe('pillStyle', { size: 'small', color: 'primary' })).toMatchInlineSnapshot(`
      "@layer recipes {
          @layer _base {
              .pillStyle {
                  padding: 8px 16px;
                  border-radius: 4px;
                  font-size: 16px;
                  font-weight: var(--font-weights-bold)
              }
          }
          .pillStyle--size_small {
              font-size: 14px;
              padding: 4px 8px
          }
          .pillStyle--color_primary {
              background-color: blue;
              color: var(--colors-white)
          }
      }"
    `)

    expect(processRecipe('pillStyle', { size: 'large', color: 'secondary', disabled: true })).toMatchInlineSnapshot(`
      "@layer recipes {
          @layer _base {
              .pillStyle {
                  padding: 8px 16px;
                  border-radius: 4px;
                  font-size: 16px;
                  font-weight: var(--font-weights-bold)
              }
          }
          .pillStyle--size_large {
              font-size: 18px;
              padding: 12px 24px
          }
          .pillStyle--color_secondary {
              background-color: gray;
              color: var(--colors-black)
          }
          .pillStyle--disabled_true {
              opacity: 0.5;
              cursor: not-allowed
          }
      }"
    `)

    expect(processRecipe('pillStyle', { size: 'medium', color: 'secondary' })).toMatchInlineSnapshot(`
      "@layer recipes {
          @layer _base {
              .pillStyle {
                  padding: 8px 16px;
                  border-radius: 4px;
                  font-size: 16px;
                  font-weight: var(--font-weights-bold)
              }
          }
          .pillStyle--size_medium {
              font-size: 16px;
              padding: 8px 16px
          }
          .pillStyle--color_secondary {
              background-color: gray;
              color: var(--colors-black)
          }
      }"
    `)
  })
})
