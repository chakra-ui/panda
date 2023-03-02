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
            "box": BoxNodeList {
              "node": CallExpression,
              "stack": [],
              "type": "list",
              "value": [
                BoxNodeMap {
                  "node": CallExpression,
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
              ],
            },
            "data": {
              "variant": "h1",
            },
            "name": "textStyle",
            "type": "recipe",
          },
          {
            "box": BoxNodeList {
              "node": CallExpression,
              "stack": [],
              "type": "list",
              "value": [
                BoxNodeMap {
                  "node": CallExpression,
                  "stack": [
                    CallExpression,
                    ObjectLiteralExpression,
                  ],
                  "type": "map",
                  "value": Map {
                    "variant" => BoxNodeMap {
                      "node": ObjectLiteralExpression,
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
              ],
            },
            "data": {
              "variant": {
                "base": "h4",
                "md": "h5",
              },
            },
            "name": "textStyle",
            "type": "recipe",
          },
          {
            "box": BoxNodeList {
              "node": CallExpression,
              "stack": [],
              "type": "list",
              "value": [],
            },
            "data": undefined,
            "name": "textStyle",
            "type": "recipe",
          },
        },
        "layerStyle" => Set {
          {
            "box": BoxNodeList {
              "node": CallExpression,
              "stack": [],
              "type": "list",
              "value": [
                BoxNodeMap {
                  "node": CallExpression,
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
              ],
            },
            "data": {
              "variant": "raised",
            },
            "name": "layerStyle",
            "type": "recipe",
          },
        },
      }
    `)
  })
})
