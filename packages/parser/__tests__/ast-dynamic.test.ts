import { describe, test, expect } from 'vitest'
import { recipeParser } from './fixture'

describe('[dynamic] ast parser', () => {
  test('should parse', () => {
    const code = `
        import { textStyle, layerStyle } from ".panda/recipe"

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
            "box": BoxNodeMap {
              "node": CallExpression,
              "spreadConditions": undefined,
              "stack": [
                CallExpression,
                ObjectLiteralExpression,
              ],
              "type": "map",
              "value": Map {
                "variant" => BoxNodeLiteral {
                  "kind": "string",
                  "node": StringLiteral,
                  "stack": [
                    CallExpression,
                    ObjectLiteralExpression,
                    PropertyAssignment,
                    StringLiteral,
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
            "box": BoxNodeMap {
              "node": CallExpression,
              "spreadConditions": undefined,
              "stack": [
                CallExpression,
                ObjectLiteralExpression,
              ],
              "type": "map",
              "value": Map {
                "variant" => BoxNodeMap {
                  "node": ObjectLiteralExpression,
                  "spreadConditions": undefined,
                  "stack": [
                    CallExpression,
                    ObjectLiteralExpression,
                    PropertyAssignment,
                    ObjectLiteralExpression,
                  ],
                  "type": "map",
                  "value": Map {
                    "base" => BoxNodeLiteral {
                      "kind": "string",
                      "node": StringLiteral,
                      "stack": [
                        CallExpression,
                        ObjectLiteralExpression,
                        PropertyAssignment,
                        ObjectLiteralExpression,
                        PropertyAssignment,
                        StringLiteral,
                      ],
                      "type": "literal",
                      "value": "h4",
                    },
                    "md" => BoxNodeLiteral {
                      "kind": "string",
                      "node": StringLiteral,
                      "stack": [
                        CallExpression,
                        ObjectLiteralExpression,
                        PropertyAssignment,
                        ObjectLiteralExpression,
                        PropertyAssignment,
                        StringLiteral,
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
            "box": undefined,
            "data": [
              {},
            ],
            "name": "textStyle",
            "type": "recipe",
          },
        },
        "layerStyle" => Set {
          {
            "box": BoxNodeMap {
              "node": CallExpression,
              "spreadConditions": undefined,
              "stack": [
                CallExpression,
                ObjectLiteralExpression,
              ],
              "type": "map",
              "value": Map {
                "variant" => BoxNodeLiteral {
                  "kind": "string",
                  "node": StringLiteral,
                  "stack": [
                    CallExpression,
                    ObjectLiteralExpression,
                    PropertyAssignment,
                    StringLiteral,
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
