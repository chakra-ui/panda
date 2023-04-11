import { describe, expect, test } from 'vitest'
import { cvaParser } from './fixture'

describe('ast parser / cva', () => {
  test('should parse', () => {
    const code = `
    import {cva} from ".panda/css"

    const baseStyle = cva({
        base: {
            color: 'red',
            fontSize: '12px',
        },
        variants: {
            color: {
                red: {
                    background: 'red'
                }
            }
        }
    })
     `

    expect(cvaParser(code)).toMatchInlineSnapshot(`
      {
        "cva": Set {
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
                "base" => BoxNodeMap {
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
                    "color" => BoxNodeLiteral {
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
                      "value": "red",
                    },
                    "fontSize" => BoxNodeLiteral {
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
                      "value": "12px",
                    },
                  },
                },
                "variants" => BoxNodeMap {
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
                    "color" => BoxNodeMap {
                      "node": ObjectLiteralExpression,
                      "spreadConditions": undefined,
                      "stack": [
                        CallExpression,
                        ObjectLiteralExpression,
                        PropertyAssignment,
                        ObjectLiteralExpression,
                        PropertyAssignment,
                        ObjectLiteralExpression,
                      ],
                      "type": "map",
                      "value": Map {
                        "red" => BoxNodeMap {
                          "node": ObjectLiteralExpression,
                          "spreadConditions": undefined,
                          "stack": [
                            CallExpression,
                            ObjectLiteralExpression,
                            PropertyAssignment,
                            ObjectLiteralExpression,
                            PropertyAssignment,
                            ObjectLiteralExpression,
                            PropertyAssignment,
                            ObjectLiteralExpression,
                          ],
                          "type": "map",
                          "value": Map {
                            "background" => BoxNodeLiteral {
                              "kind": "string",
                              "node": StringLiteral,
                              "stack": [
                                CallExpression,
                                ObjectLiteralExpression,
                                PropertyAssignment,
                                ObjectLiteralExpression,
                                PropertyAssignment,
                                ObjectLiteralExpression,
                                PropertyAssignment,
                                ObjectLiteralExpression,
                                PropertyAssignment,
                                StringLiteral,
                              ],
                              "type": "literal",
                              "value": "red",
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            "data": [
              {
                "base": {
                  "color": "red",
                  "fontSize": "12px",
                },
                "variants": {
                  "color": {
                    "red": {
                      "background": "red",
                    },
                  },
                },
              },
            ],
            "name": "cva",
            "type": "object",
          },
        },
      }
    `)
  })
})
