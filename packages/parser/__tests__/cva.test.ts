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
            },
            size: {
                sm: {
                    fontSize: '12px'
                },
                md: {
                    fontSize: '24px'
                }
            }
        },
        compoundVariants: [
            {
                color: 'red',
                size: 'sm',
                css: {
                    fontWeight: 'bold'
                }
            },
            {
                color: ['red', 'blue'],
                size: ['sm', 'md'],
                css: {
                    color: 'white'
                }
            }
        ]
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
                    "size" => BoxNodeMap {
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
                        "sm" => BoxNodeMap {
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
                            "fontSize" => BoxNodeLiteral {
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
                              "value": "12px",
                            },
                          },
                        },
                        "md" => BoxNodeMap {
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
                            "fontSize" => BoxNodeLiteral {
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
                              "value": "24px",
                            },
                          },
                        },
                      },
                    },
                  },
                },
                "compoundVariants" => BoxNodeArray {
                  "node": ArrayLiteralExpression,
                  "stack": [
                    CallExpression,
                    ObjectLiteralExpression,
                    PropertyAssignment,
                    ArrayLiteralExpression,
                  ],
                  "type": "array",
                  "value": [
                    BoxNodeMap {
                      "node": ObjectLiteralExpression,
                      "spreadConditions": undefined,
                      "stack": [
                        CallExpression,
                        ObjectLiteralExpression,
                        PropertyAssignment,
                        ArrayLiteralExpression,
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
                            ArrayLiteralExpression,
                            PropertyAssignment,
                            StringLiteral,
                          ],
                          "type": "literal",
                          "value": "red",
                        },
                        "size" => BoxNodeLiteral {
                          "kind": "string",
                          "node": StringLiteral,
                          "stack": [
                            CallExpression,
                            ObjectLiteralExpression,
                            PropertyAssignment,
                            ArrayLiteralExpression,
                            PropertyAssignment,
                            StringLiteral,
                          ],
                          "type": "literal",
                          "value": "sm",
                        },
                        "css" => BoxNodeMap {
                          "node": ObjectLiteralExpression,
                          "spreadConditions": undefined,
                          "stack": [
                            CallExpression,
                            ObjectLiteralExpression,
                            PropertyAssignment,
                            ArrayLiteralExpression,
                            PropertyAssignment,
                            ObjectLiteralExpression,
                          ],
                          "type": "map",
                          "value": Map {
                            "fontWeight" => BoxNodeLiteral {
                              "kind": "string",
                              "node": StringLiteral,
                              "stack": [
                                CallExpression,
                                ObjectLiteralExpression,
                                PropertyAssignment,
                                ArrayLiteralExpression,
                                PropertyAssignment,
                                ObjectLiteralExpression,
                                PropertyAssignment,
                                StringLiteral,
                              ],
                              "type": "literal",
                              "value": "bold",
                            },
                          },
                        },
                      },
                    },
                    BoxNodeMap {
                      "node": ObjectLiteralExpression,
                      "spreadConditions": undefined,
                      "stack": [
                        CallExpression,
                        ObjectLiteralExpression,
                        PropertyAssignment,
                        ArrayLiteralExpression,
                      ],
                      "type": "map",
                      "value": Map {
                        "color" => BoxNodeArray {
                          "node": ArrayLiteralExpression,
                          "stack": [
                            CallExpression,
                            ObjectLiteralExpression,
                            PropertyAssignment,
                            ArrayLiteralExpression,
                            PropertyAssignment,
                            ArrayLiteralExpression,
                          ],
                          "type": "array",
                          "value": [
                            BoxNodeLiteral {
                              "kind": "string",
                              "node": StringLiteral,
                              "stack": [
                                CallExpression,
                                ObjectLiteralExpression,
                                PropertyAssignment,
                                ArrayLiteralExpression,
                                PropertyAssignment,
                                ArrayLiteralExpression,
                              ],
                              "type": "literal",
                              "value": "red",
                            },
                            BoxNodeLiteral {
                              "kind": "string",
                              "node": StringLiteral,
                              "stack": [
                                CallExpression,
                                ObjectLiteralExpression,
                                PropertyAssignment,
                                ArrayLiteralExpression,
                                PropertyAssignment,
                                ArrayLiteralExpression,
                              ],
                              "type": "literal",
                              "value": "blue",
                            },
                          ],
                        },
                        "size" => BoxNodeArray {
                          "node": ArrayLiteralExpression,
                          "stack": [
                            CallExpression,
                            ObjectLiteralExpression,
                            PropertyAssignment,
                            ArrayLiteralExpression,
                            PropertyAssignment,
                            ArrayLiteralExpression,
                          ],
                          "type": "array",
                          "value": [
                            BoxNodeLiteral {
                              "kind": "string",
                              "node": StringLiteral,
                              "stack": [
                                CallExpression,
                                ObjectLiteralExpression,
                                PropertyAssignment,
                                ArrayLiteralExpression,
                                PropertyAssignment,
                                ArrayLiteralExpression,
                              ],
                              "type": "literal",
                              "value": "sm",
                            },
                            BoxNodeLiteral {
                              "kind": "string",
                              "node": StringLiteral,
                              "stack": [
                                CallExpression,
                                ObjectLiteralExpression,
                                PropertyAssignment,
                                ArrayLiteralExpression,
                                PropertyAssignment,
                                ArrayLiteralExpression,
                              ],
                              "type": "literal",
                              "value": "md",
                            },
                          ],
                        },
                        "css" => BoxNodeMap {
                          "node": ObjectLiteralExpression,
                          "spreadConditions": undefined,
                          "stack": [
                            CallExpression,
                            ObjectLiteralExpression,
                            PropertyAssignment,
                            ArrayLiteralExpression,
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
                                ArrayLiteralExpression,
                                PropertyAssignment,
                                ObjectLiteralExpression,
                                PropertyAssignment,
                                StringLiteral,
                              ],
                              "type": "literal",
                              "value": "white",
                            },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
            "data": [
              {
                "base": {
                  "color": "red",
                  "fontSize": "12px",
                },
                "compoundVariants": [
                  {
                    "color": "red",
                    "css": {
                      "fontWeight": "bold",
                    },
                    "size": "sm",
                  },
                  {
                    "color": [
                      "red",
                      "blue",
                    ],
                    "css": {
                      "color": "white",
                    },
                    "size": [
                      "sm",
                      "md",
                    ],
                  },
                ],
                "variants": {
                  "color": {
                    "red": {
                      "background": "red",
                    },
                  },
                  "size": {
                    "md": {
                      "fontSize": "24px",
                    },
                    "sm": {
                      "fontSize": "12px",
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
