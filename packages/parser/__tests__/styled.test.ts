import { describe, expect, test } from 'vitest'
import { styledParser } from './fixture'

describe('ast parser / styled', () => {
  test('should parse', () => {
    const code = `
    import {panda} from ".panda/jsx"

    const baseStyle = panda("div", {
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

    expect(styledParser(code)).toMatchInlineSnapshot(`
      {
        "cva": Set {
          {
            "box": BoxNodeList {
              "node": CallExpression,
              "stack": [],
              "type": "list",
              "value": [
                BoxNodeLiteral {
                  "kind": "string",
                  "node": StringLiteral,
                  "stack": [
                    CallExpression,
                    StringLiteral,
                  ],
                  "type": "literal",
                  "value": "div",
                },
                BoxNodeMap {
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
              ],
            },
            "data": [
              "div",
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
            "name": "panda",
            "type": "cva",
          },
        },
      }
    `)
  })
})
