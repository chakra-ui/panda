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
              "endColumn": 11,
              "endLineNumber": 6,
              "line": 4,
              "node": "CallExpression",
              "type": "map",
              "value": Map {
                "variant" => {
                  "column": 22,
                  "endColumn": 26,
                  "endLineNumber": 5,
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
              "endColumn": 9,
              "endLineNumber": 14,
              "line": 12,
              "node": "CallExpression",
              "type": "map",
              "value": Map {
                "variant" => {
                  "column": 20,
                  "endColumn": 43,
                  "endLineNumber": 13,
                  "line": 13,
                  "node": "ObjectLiteralExpression",
                  "type": "map",
                  "value": Map {
                    "base" => {
                      "column": 27,
                      "endColumn": 31,
                      "endLineNumber": 13,
                      "line": 13,
                      "node": "StringLiteral",
                      "type": "literal",
                      "value": "h4",
                    },
                    "md" => {
                      "column": 37,
                      "endColumn": 41,
                      "endLineNumber": 13,
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
              "getRange": [Function],
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
