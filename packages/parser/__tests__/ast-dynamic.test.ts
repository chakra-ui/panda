import { describe, test, expect } from 'vitest'
import { recipeParser } from './fixture'

describe('[dynamic] ast parser', () => {
  test('should parse', () => {
    const code = `
        import { textStyle, layerStyle } from "styled-system/recipes"

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
              "column": 9,
              "line": 4,
              "node": "CallExpression",
              "type": "map",
              "value": Map {
                "variant" => {
                  "column": 22,
                  "line": 5,
                  "node": "StringLiteral",
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
              "column": 9,
              "line": 12,
              "node": "CallExpression",
              "type": "map",
              "value": Map {
                "variant" => {
                  "column": 20,
                  "line": 13,
                  "node": "ObjectLiteralExpression",
                  "type": "map",
                  "value": Map {
                    "base" => {
                      "column": 27,
                      "line": 13,
                      "node": "StringLiteral",
                      "type": "literal",
                      "value": "h4",
                    },
                    "md" => {
                      "column": 37,
                      "line": 13,
                      "node": "StringLiteral",
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
      }
    `)
  })
})
