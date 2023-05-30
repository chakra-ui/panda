import { describe, test, expect } from 'vitest'
import { jsxRecipeParser } from './fixture'

describe('recipe jsx', () => {
  test('should extract', () => {
    const code = `
    import { Button } from ".panda/jsx"
    import { button } from ".panda/recipes"

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
              "node": "CallExpression",
              "stack": [
                "CallExpression",
                "ObjectLiteralExpression",
              ],
              "type": "map",
              "value": Map {},
            },
            "data": [
              {},
            ],
            "name": "button",
            "type": "recipe",
          },
          {
            "box": {
              "node": "JsxOpeningElement",
              "stack": [],
              "type": "map",
              "value": Map {
                "size" => {
                  "node": "StringLiteral",
                  "stack": [
                    "JsxAttribute",
                    "StringLiteral",
                  ],
                  "type": "literal",
                  "value": "sm",
                },
                "mt" => {
                  "node": "StringLiteral",
                  "stack": [
                    "JsxAttribute",
                    "StringLiteral",
                  ],
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
              "node": "JsxOpeningElement",
              "stack": [],
              "type": "map",
              "value": Map {
                "size" => {
                  "node": "StringLiteral",
                  "stack": [
                    "JsxAttribute",
                    "StringLiteral",
                  ],
                  "type": "literal",
                  "value": "sm",
                },
                "variant" => {
                  "node": "ObjectLiteralExpression",
                  "stack": [
                    "JsxAttribute",
                    "JsxExpression",
                    "ObjectLiteralExpression",
                  ],
                  "type": "map",
                  "value": Map {
                    "base" => {
                      "node": "StringLiteral",
                      "stack": [
                        "JsxAttribute",
                        "JsxExpression",
                        "ObjectLiteralExpression",
                        "PropertyAssignment",
                        "StringLiteral",
                      ],
                      "type": "literal",
                      "value": "outline",
                    },
                    "md" => {
                      "node": "StringLiteral",
                      "stack": [
                        "JsxAttribute",
                        "JsxExpression",
                        "ObjectLiteralExpression",
                        "PropertyAssignment",
                        "StringLiteral",
                      ],
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
              "node": "JsxSelfClosingElement",
              "stack": [],
              "type": "map",
              "value": Map {
                "size" => {
                  "node": "StringLiteral",
                  "stack": [
                    "JsxAttribute",
                    "StringLiteral",
                  ],
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
