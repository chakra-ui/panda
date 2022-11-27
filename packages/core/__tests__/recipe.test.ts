import { describe, expect, test } from 'vitest'
import { getRecipe, processRecipe } from './fixture'

describe('recipe ruleset', () => {
  test('should work with basic', () => {
    expect(processRecipe('textStyle', { variant: 'h1' })).toMatchInlineSnapshot(`
      "@layer recipes {
          .textStyle {
              font-family: var(--fonts-mono);
              & > * ~ * {
                  border-left-width: 20px;
                  border-right-width: 0px
              }
          }
      }"
    `)

    expect(processRecipe('textStyle', {})).toMatchInlineSnapshot(`
      "@layer recipes {
          .textStyle {
              font-family: var(--fonts-mono);
              & > * ~ * {
                  border-left-width: 20px;
                  border-right-width: 0px
              }
          }
      }"
    `)

    expect(processRecipe('textStyle', { variant: { _: 'h1', md: 'h2' } })).toMatchInlineSnapshot(`
      "@layer recipes {
          .textStyle {
              font-family: var(--fonts-mono);
              & > * ~ * {
                  border-left-width: 20px;
                  border-right-width: 0px
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
        "defaultVariants": {
          "size": "md",
          "variant": "solid",
        },
        "description": "",
        "jsx": "ButtonStyle",
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
              "&:hover": {
                "backgroundColor": "blue",
                "color": "white",
              },
              "&[data-disabled]": {
                "backgroundColor": "transparent",
                "border": "1px solid gray",
                "color": "gray",
              },
              "backgroundColor": "transparent",
              "border": "1px solid blue",
              "color": "blue",
            },
            "solid": {
              "&:hover": {
                "backgroundColor": "darkblue",
              },
              "&[data-disabled]": {
                "backgroundColor": "gray",
                "color": "black",
              },
              "backgroundColor": "blue",
              "color": "white",
            },
          },
        },
      }
    `)

    expect(processRecipe('buttonStyle', { variant: 'solid' })).toMatchInlineSnapshot(`
      "@layer recipes {
          .buttonStyle {
              display: inline-flex;
              align-items: center;
              justify-content: center
          }
          .buttonStyle--size_md {
              height: 3rem;
              min-width: 3rem;
              padding: 0 0.75rem
          }
          .buttonStyle--variant_solid {
              background-color: blue;
              color: white;
              &:hover {
                  background-color: darkblue
              }
              &[data-disabled] {
                  background-color: gray;
                  color: black
              }
          }
      }"
    `)

    expect(processRecipe('buttonStyle', { variant: { _: 'solid', lg: 'outline' } })).toMatchInlineSnapshot(`
      "@layer recipes {
          .buttonStyle {
              display: inline-flex;
              align-items: center;
              justify-content: center
          }
          .buttonStyle--size_md {
              height: 3rem;
              min-width: 3rem;
              padding: 0 0.75rem
          }
          .buttonStyle--variant_solid {
              background-color: blue;
              color: white;
              &:hover {
                  background-color: darkblue
              }
              &[data-disabled] {
                  background-color: gray;
                  color: black
              }
          }
          @screen lg {
              .lg\\\\:buttonStyle--variant_outline {
                  background-color: transparent;
                  border: 1px solid blue;
                  color: blue;
                  &:hover {
                      background-color: blue;
                      color: white
                  }
                  &[data-disabled] {
                      background-color: transparent;
                      border: 1px solid gray;
                      color: gray
                  }
              }
          }
      }"
    `)
  })
})
