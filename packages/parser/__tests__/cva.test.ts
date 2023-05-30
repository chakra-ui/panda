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
            "box": {
              "node": "CallExpression",
              "stack": [
                "CallExpression",
                "ObjectLiteralExpression",
              ],
              "type": "map",
              "value": Map {
                "base" => {
                  "node": "ObjectLiteralExpression",
                  "stack": [
                    "CallExpression",
                    "ObjectLiteralExpression",
                    "PropertyAssignment",
                    "ObjectLiteralExpression",
                  ],
                  "type": "map",
                  "value": Map {
                    "color" => {
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
                      "value": "red",
                    },
                    "fontSize" => {
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
                      "value": "12px",
                    },
                  },
                },
                "variants" => {
                  "node": "ObjectLiteralExpression",
                  "stack": [
                    "CallExpression",
                    "ObjectLiteralExpression",
                    "PropertyAssignment",
                    "ObjectLiteralExpression",
                  ],
                  "type": "map",
                  "value": Map {
                    "color" => {
                      "node": "ObjectLiteralExpression",
                      "stack": [
                        "CallExpression",
                        "ObjectLiteralExpression",
                        "PropertyAssignment",
                        "ObjectLiteralExpression",
                        "PropertyAssignment",
                        "ObjectLiteralExpression",
                      ],
                      "type": "map",
                      "value": Map {
                        "red" => {
                          "node": "ObjectLiteralExpression",
                          "stack": [
                            "CallExpression",
                            "ObjectLiteralExpression",
                            "PropertyAssignment",
                            "ObjectLiteralExpression",
                            "PropertyAssignment",
                            "ObjectLiteralExpression",
                            "PropertyAssignment",
                            "ObjectLiteralExpression",
                          ],
                          "type": "map",
                          "value": Map {
                            "background" => {
                              "node": "StringLiteral",
                              "stack": [
                                "CallExpression",
                                "ObjectLiteralExpression",
                                "PropertyAssignment",
                                "ObjectLiteralExpression",
                                "PropertyAssignment",
                                "ObjectLiteralExpression",
                                "PropertyAssignment",
                                "ObjectLiteralExpression",
                                "PropertyAssignment",
                                "StringLiteral",
                              ],
                              "type": "literal",
                              "value": "red",
                            },
                          },
                        },
                      },
                    },
                    "size" => {
                      "node": "ObjectLiteralExpression",
                      "stack": [
                        "CallExpression",
                        "ObjectLiteralExpression",
                        "PropertyAssignment",
                        "ObjectLiteralExpression",
                        "PropertyAssignment",
                        "ObjectLiteralExpression",
                      ],
                      "type": "map",
                      "value": Map {
                        "sm" => {
                          "node": "ObjectLiteralExpression",
                          "stack": [
                            "CallExpression",
                            "ObjectLiteralExpression",
                            "PropertyAssignment",
                            "ObjectLiteralExpression",
                            "PropertyAssignment",
                            "ObjectLiteralExpression",
                            "PropertyAssignment",
                            "ObjectLiteralExpression",
                          ],
                          "type": "map",
                          "value": Map {
                            "fontSize" => {
                              "node": "StringLiteral",
                              "stack": [
                                "CallExpression",
                                "ObjectLiteralExpression",
                                "PropertyAssignment",
                                "ObjectLiteralExpression",
                                "PropertyAssignment",
                                "ObjectLiteralExpression",
                                "PropertyAssignment",
                                "ObjectLiteralExpression",
                                "PropertyAssignment",
                                "StringLiteral",
                              ],
                              "type": "literal",
                              "value": "12px",
                            },
                          },
                        },
                        "md" => {
                          "node": "ObjectLiteralExpression",
                          "stack": [
                            "CallExpression",
                            "ObjectLiteralExpression",
                            "PropertyAssignment",
                            "ObjectLiteralExpression",
                            "PropertyAssignment",
                            "ObjectLiteralExpression",
                            "PropertyAssignment",
                            "ObjectLiteralExpression",
                          ],
                          "type": "map",
                          "value": Map {
                            "fontSize" => {
                              "node": "StringLiteral",
                              "stack": [
                                "CallExpression",
                                "ObjectLiteralExpression",
                                "PropertyAssignment",
                                "ObjectLiteralExpression",
                                "PropertyAssignment",
                                "ObjectLiteralExpression",
                                "PropertyAssignment",
                                "ObjectLiteralExpression",
                                "PropertyAssignment",
                                "StringLiteral",
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
                "compoundVariants" => {
                  "node": "ArrayLiteralExpression",
                  "stack": [
                    "CallExpression",
                    "ObjectLiteralExpression",
                    "PropertyAssignment",
                    "ArrayLiteralExpression",
                  ],
                  "type": "array",
                  "value": [
                    {
                      "node": "ObjectLiteralExpression",
                      "stack": [
                        "CallExpression",
                        "ObjectLiteralExpression",
                        "PropertyAssignment",
                        "ArrayLiteralExpression",
                      ],
                      "type": "map",
                      "value": Map {
                        "color" => {
                          "node": "StringLiteral",
                          "stack": [
                            "CallExpression",
                            "ObjectLiteralExpression",
                            "PropertyAssignment",
                            "ArrayLiteralExpression",
                            "PropertyAssignment",
                            "StringLiteral",
                          ],
                          "type": "literal",
                          "value": "red",
                        },
                        "size" => {
                          "node": "StringLiteral",
                          "stack": [
                            "CallExpression",
                            "ObjectLiteralExpression",
                            "PropertyAssignment",
                            "ArrayLiteralExpression",
                            "PropertyAssignment",
                            "StringLiteral",
                          ],
                          "type": "literal",
                          "value": "sm",
                        },
                        "css" => {
                          "node": "ObjectLiteralExpression",
                          "stack": [
                            "CallExpression",
                            "ObjectLiteralExpression",
                            "PropertyAssignment",
                            "ArrayLiteralExpression",
                            "PropertyAssignment",
                            "ObjectLiteralExpression",
                          ],
                          "type": "map",
                          "value": Map {
                            "fontWeight" => {
                              "node": "StringLiteral",
                              "stack": [
                                "CallExpression",
                                "ObjectLiteralExpression",
                                "PropertyAssignment",
                                "ArrayLiteralExpression",
                                "PropertyAssignment",
                                "ObjectLiteralExpression",
                                "PropertyAssignment",
                                "StringLiteral",
                              ],
                              "type": "literal",
                              "value": "bold",
                            },
                          },
                        },
                      },
                    },
                    {
                      "node": "ObjectLiteralExpression",
                      "stack": [
                        "CallExpression",
                        "ObjectLiteralExpression",
                        "PropertyAssignment",
                        "ArrayLiteralExpression",
                      ],
                      "type": "map",
                      "value": Map {
                        "color" => {
                          "node": "ArrayLiteralExpression",
                          "stack": [
                            "CallExpression",
                            "ObjectLiteralExpression",
                            "PropertyAssignment",
                            "ArrayLiteralExpression",
                            "PropertyAssignment",
                            "ArrayLiteralExpression",
                          ],
                          "type": "array",
                          "value": [
                            {
                              "node": "StringLiteral",
                              "stack": [
                                "CallExpression",
                                "ObjectLiteralExpression",
                                "PropertyAssignment",
                                "ArrayLiteralExpression",
                                "PropertyAssignment",
                                "ArrayLiteralExpression",
                              ],
                              "type": "literal",
                              "value": "red",
                            },
                            {
                              "node": "StringLiteral",
                              "stack": [
                                "CallExpression",
                                "ObjectLiteralExpression",
                                "PropertyAssignment",
                                "ArrayLiteralExpression",
                                "PropertyAssignment",
                                "ArrayLiteralExpression",
                              ],
                              "type": "literal",
                              "value": "blue",
                            },
                          ],
                        },
                        "size" => {
                          "node": "ArrayLiteralExpression",
                          "stack": [
                            "CallExpression",
                            "ObjectLiteralExpression",
                            "PropertyAssignment",
                            "ArrayLiteralExpression",
                            "PropertyAssignment",
                            "ArrayLiteralExpression",
                          ],
                          "type": "array",
                          "value": [
                            {
                              "node": "StringLiteral",
                              "stack": [
                                "CallExpression",
                                "ObjectLiteralExpression",
                                "PropertyAssignment",
                                "ArrayLiteralExpression",
                                "PropertyAssignment",
                                "ArrayLiteralExpression",
                              ],
                              "type": "literal",
                              "value": "sm",
                            },
                            {
                              "node": "StringLiteral",
                              "stack": [
                                "CallExpression",
                                "ObjectLiteralExpression",
                                "PropertyAssignment",
                                "ArrayLiteralExpression",
                                "PropertyAssignment",
                                "ArrayLiteralExpression",
                              ],
                              "type": "literal",
                              "value": "md",
                            },
                          ],
                        },
                        "css" => {
                          "node": "ObjectLiteralExpression",
                          "stack": [
                            "CallExpression",
                            "ObjectLiteralExpression",
                            "PropertyAssignment",
                            "ArrayLiteralExpression",
                            "PropertyAssignment",
                            "ObjectLiteralExpression",
                          ],
                          "type": "map",
                          "value": Map {
                            "color" => {
                              "node": "StringLiteral",
                              "stack": [
                                "CallExpression",
                                "ObjectLiteralExpression",
                                "PropertyAssignment",
                                "ArrayLiteralExpression",
                                "PropertyAssignment",
                                "ObjectLiteralExpression",
                                "PropertyAssignment",
                                "StringLiteral",
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
