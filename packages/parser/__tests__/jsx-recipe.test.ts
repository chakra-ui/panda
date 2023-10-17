import { describe, test, expect } from 'vitest'
import { jsxRecipeParser } from './fixture'

describe('recipe jsx', () => {
  test('should extract', () => {
    const code = `
    import { Button } from "styled-system/jsx"
    import { button } from "styled-system/recipes"

      function AnotherButtonWithRegex({ children, variant, size, css: cssProp }: ButtonProps) {
        return <button className={cx(button({ variant, size }), css(cssProp))}>{children}</button>
      }

       function ActionButton() {
         return (
            <div>
               <Button size="sm" mt="40px">Welcome</Button>
               <Button size="sm" variant={{ base: "outline", md: "solid" }}>Welcome</Button>
               <button size="fluff">Hello</button>
               <Random size="50px" />
               <AnotherButtonWithRegex size="50px" />
            </div>
        )
       }
     `

    expect(jsxRecipeParser(code)).toMatchInlineSnapshot(`
      Map {
        "button" => Set {
          {
            "box": {
              "column": 38,
              "line": 6,
              "node": "CallExpression",
              "type": "map",
              "value": Map {
                "variant" => {
                  "column": 51,
                  "line": 5,
                  "node": "BindingElement",
                  "type": "unresolvable",
                  "value": undefined,
                },
                "size" => {
                  "column": 60,
                  "line": 5,
                  "node": "BindingElement",
                  "type": "unresolvable",
                  "value": undefined,
                },
              },
            },
            "data": [
              {},
            ],
            "name": "button",
            "type": "recipe",
          },
          {
            "box": {
              "column": 16,
              "line": 12,
              "node": "JsxOpeningElement",
              "type": "map",
              "value": Map {
                "size" => {
                  "column": 29,
                  "line": 12,
                  "node": "StringLiteral",
                  "type": "literal",
                  "value": "sm",
                },
                "mt" => {
                  "column": 37,
                  "line": 12,
                  "node": "StringLiteral",
                  "type": "literal",
                  "value": "40px",
                },
              },
            },
            "data": [
              {
                "mt": "40px",
                "size": "sm",
              },
            ],
            "name": "Button",
            "type": "jsx-recipe",
          },
          {
            "box": {
              "column": 16,
              "line": 13,
              "node": "JsxOpeningElement",
              "type": "map",
              "value": Map {
                "size" => {
                  "column": 29,
                  "line": 13,
                  "node": "StringLiteral",
                  "type": "literal",
                  "value": "sm",
                },
                "variant" => {
                  "column": 43,
                  "line": 13,
                  "node": "ObjectLiteralExpression",
                  "type": "map",
                  "value": Map {
                    "base" => {
                      "column": 51,
                      "line": 13,
                      "node": "StringLiteral",
                      "type": "literal",
                      "value": "outline",
                    },
                    "md" => {
                      "column": 66,
                      "line": 13,
                      "node": "StringLiteral",
                      "type": "literal",
                      "value": "solid",
                    },
                  },
                },
              },
            },
            "data": [
              {
                "size": "sm",
                "variant": {
                  "base": "outline",
                  "md": "solid",
                },
              },
            ],
            "name": "Button",
            "type": "jsx-recipe",
          },
          {
            "box": {
              "column": 16,
              "line": 16,
              "node": "JsxSelfClosingElement",
              "type": "map",
              "value": Map {
                "size" => {
                  "column": 45,
                  "line": 16,
                  "node": "StringLiteral",
                  "type": "literal",
                  "value": "50px",
                },
              },
            },
            "data": [
              {
                "size": "50px",
              },
            ],
            "name": "AnotherButtonWithRegex",
            "type": "jsx-recipe",
          },
        },
      }
    `)
  })
})
