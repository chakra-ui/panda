import { describe, test, expect } from 'vitest'
import { recipeParser } from './fixture'

describe('[dynamic] ast parser', () => {
  test('should parse', () => {
    const code = `
        import { textStyle, layerStyle } from ".panda/recipes"

        textStyle({
            variant: "h1"
        })

        layerStyle({
           variant: "raised"
        })

        textStyle({
          variant: { base:"h4", md: "h5" }
      })

      textStyle()

      console.log("ere")
     `

    expect(recipeParser(code)).toMatchInlineSnapshot(`
      Map {
        "textStyle" => Set {
          {
            "box": {
              "node": "CallExpression",
              "stack": [
                "CallExpression",
                "ObjectLiteralExpression",
              ],
              "type": "map",
              "value": Map {
                "variant" => {
                  "node": "StringLiteral",
                  "stack": [
                    "CallExpression",
                    "ObjectLiteralExpression",
                    "PropertyAssignment",
                    "StringLiteral",
                  ],
                  "type": "literal",
                  "value": "h1",
                },
              },
            },
            "data": [
              {
                "variant": "h1",
              },
            ],
            "name": "textStyle",
            "type": "recipe",
          },
          {
            "box": {
              "node": "CallExpression",
              "stack": [
                "CallExpression",
                "ObjectLiteralExpression",
              ],
              "type": "map",
              "value": Map {
                "variant" => {
                  "node": "ObjectLiteralExpression",
                  "stack": [
                    "CallExpression",
                    "ObjectLiteralExpression",
                    "PropertyAssignment",
                    "ObjectLiteralExpression",
                  ],
                  "type": "map",
                  "value": Map {
                    "base" => {
                      "node": "StringLiteral",
                      "stack": [
                        "CallExpression",
                        "ObjectLiteralExpression",
                        "PropertyAssignment",
                        "ObjectLiteralExpression",
                        "PropertyAssignment",
                        "StringLiteral",
                      ],
                      "type": "literal",
                      "value": "h4",
                    },
                    "md" => {
                      "node": "StringLiteral",
                      "stack": [
                        "CallExpression",
                        "ObjectLiteralExpression",
                        "PropertyAssignment",
                        "ObjectLiteralExpression",
                        "PropertyAssignment",
                        "StringLiteral",
                      ],
                      "type": "literal",
                      "value": "h5",
                    },
                  },
                },
              },
            },
            "data": [
              {
                "variant": {
                  "base": "h4",
                  "md": "h5",
                },
              },
            ],
            "name": "textStyle",
            "type": "recipe",
          },
          {
            "box": {
              "getNode": [Function],
              "getStack": [Function],
              "value": undefined,
            },
            "data": [
              {},
            ],
            "name": "textStyle",
            "type": "recipe",
          },
        },
        "layerStyle" => Set {
          {
            "box": {
              "node": "CallExpression",
              "stack": [
                "CallExpression",
                "ObjectLiteralExpression",
              ],
              "type": "map",
              "value": Map {
                "variant" => {
                  "node": "StringLiteral",
                  "stack": [
                    "CallExpression",
                    "ObjectLiteralExpression",
                    "PropertyAssignment",
                    "StringLiteral",
                  ],
                  "type": "literal",
                  "value": "raised",
                },
              },
            },
            "data": [
              {
                "variant": "raised",
              },
            ],
            "name": "layerStyle",
            "type": "recipe",
          },
        },
      }
    `)
  })
})
