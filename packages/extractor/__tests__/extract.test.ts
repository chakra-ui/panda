import { SourceFile } from 'ts-morph'
import { afterEach, expect, it } from 'vitest'
import { getBoxLiteralValue } from '../src/getBoxLiteralValue'
import type { ExtractedFunctionResult, ExtractOptions } from '../src/types'
import { createProject, getTestExtract } from './createProject'
// @ts-ignore
import { default as ExtractSample } from './ExtractSample?raw'

const project = createProject()

let sourceFile: SourceFile
afterEach(() => {
  if (!sourceFile) return

  if (sourceFile.wasForgotten()) return
  project.removeSourceFile(sourceFile)
})

const config: Record<string, string[]> = {
  ColorBox: ['color', 'backgroundColor', 'zIndex', 'fontSize', 'display', 'mobile', 'tablet', 'desktop', 'css'],
}

const componentsMatcher = {
  matchTag: ({ tagName }) => Boolean(config[tagName]),
  matchProp: ({ tagName, propName }) => config[tagName].includes(propName),
}

type TestExtractOptions = Omit<ExtractOptions, 'ast'> & { tagNameList?: string[]; functionNameList?: string[] }
const getExtract = (code: string, options: TestExtractOptions) => getTestExtract(project, code, options)

const extractFromCode = (code: string, options?: TestExtractOptions) => {
  const extracted = getExtract(code, { components: componentsMatcher, ...options })
  return Array.from(extracted.entries()).map(([name, props]) => [
    name,
    Array.from(props.nodesByProp.entries()).map(([propName, propValues]) => [propName, getBoxLiteralValue(propValues)]),
    extracted.get(name)!.nodesByProp,
  ])
}

it('extract it all', () => {
  expect(extractFromCode(ExtractSample)).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  [
                      "color",
                      [
                          "red.200",
                          "yellow.300",
                          ["cyan.400", "cyan.500"],
                          "facebook.400",
                          "gray.100",
                          "facebook.500",
                          ["facebook.600", "gray.200"],
                          ["gray.200", "gray.300"],
                          "gray.100",
                          "facebook.900",
                          "facebook.900",
                          "pink.100",
                          "pink.100",
                          "pink.100",
                          "pink.100",
                          "pink.100",
                          "facebook.900",
                          "facebook.900",
                          "facebook.900",
                          "gray.100",
                          "gray.100",
                          "gray.100",
                          "gray.100",
                          "gray.100",
                          "gray.100",
                          "gray.100",
                          "gray.100",
                          "gray.100",
                          "gray.100",
                          "gray.100",
                          ["gray.600", "gray.800"],
                          ["gray.700", "gray.100"],
                          "gray.100",
                          "facebook.100",
                          "blackAlpha.400",
                          "blackAlpha.400",
                          "facebook.200",
                          "facebook.200",
                          "facebook.300",
                          "twitter.100",
                          "orange.100",
                          "orange.200",
                          "orange.400",
                          "telegram.300",
                          {
                              default: "red.100",
                              hover: "green.100",
                              focus: "blue.100",
                          },
                          "facebook.900",
                          "facebook.900",
                          "facebook.900",
                          "red.100",
                          "red.100",
                          "green.100",
                          "blue.100",
                          "yellow.100",
                          "orange.100",
                          "orange.300",
                          "red.100",
                          "orange.400",
                      ],
                  ],
                  [
                      "backgroundColor",
                      [
                          "blackAlpha.100",
                          "blackAlpha.100",
                          "twitter.200",
                          "twitter.200",
                          "telegram.400",
                          {
                              default: "orange.800",
                              hover: "telegram.200",
                              focus: "yellow.700",
                          },
                      ],
                  ],
              ],
              {
                  color: [
                      {
                          stack: ["JsxAttribute", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "red.200",
                          kind: "string",
                      },
                      {
                          stack: ["JsxAttribute", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "yellow.300",
                          kind: "string",
                      },
                      {
                          stack: ["JsxAttribute", "JsxExpression", "ConditionalExpression"],
                          type: "conditional",
                          node: "ConditionalExpression",
                          whenTrue: {
                              stack: ["JsxAttribute", "JsxExpression", "ConditionalExpression"],
                              type: "literal",
                              node: "StringLiteral",
                              value: "cyan.400",
                              kind: "string",
                          },
                          whenFalse: {
                              stack: ["JsxAttribute", "JsxExpression", "ConditionalExpression"],
                              type: "literal",
                              node: "StringLiteral",
                              value: "cyan.500",
                              kind: "string",
                          },
                          kind: "ternary",
                      },
                      {
                          stack: ["JsxAttribute", "JsxExpression", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "facebook.400",
                          kind: "string",
                      },
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "gray.100",
                          kind: "string",
                      },
                      {
                          stack: ["JsxAttribute", "JsxExpression", "ConditionalExpression"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "facebook.500",
                          kind: "string",
                      },
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ConditionalExpression",
                              "Identifier",
                              "VariableDeclaration",
                          ],
                          type: "conditional",
                          node: "ConditionalExpression",
                          whenTrue: {
                              stack: ["JsxAttribute", "JsxExpression", "ConditionalExpression"],
                              type: "literal",
                              node: "StringLiteral",
                              value: "facebook.600",
                              kind: "string",
                          },
                          whenFalse: {
                              stack: [
                                  "JsxAttribute",
                                  "JsxExpression",
                                  "ConditionalExpression",
                                  "Identifier",
                                  "VariableDeclaration",
                                  "StringLiteral",
                              ],
                              type: "literal",
                              node: "StringLiteral",
                              value: "gray.200",
                              kind: "string",
                          },
                          kind: "ternary",
                      },
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ConditionalExpression",
                              "Identifier",
                              "VariableDeclaration",
                              "Identifier",
                              "VariableDeclaration",
                          ],
                          type: "conditional",
                          node: "ConditionalExpression",
                          whenTrue: {
                              stack: [
                                  "JsxAttribute",
                                  "JsxExpression",
                                  "ConditionalExpression",
                                  "Identifier",
                                  "VariableDeclaration",
                                  "StringLiteral",
                              ],
                              type: "literal",
                              node: "StringLiteral",
                              value: "gray.200",
                              kind: "string",
                          },
                          whenFalse: {
                              stack: [
                                  "JsxAttribute",
                                  "JsxExpression",
                                  "ConditionalExpression",
                                  "Identifier",
                                  "VariableDeclaration",
                                  "Identifier",
                                  "VariableDeclaration",
                                  "StringLiteral",
                              ],
                              type: "literal",
                              node: "StringLiteral",
                              value: "gray.300",
                              kind: "string",
                          },
                          kind: "ternary",
                      },
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "gray.100",
                          kind: "string",
                      },
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "ObjectLiteralExpression",
                              "StringLiteral",
                              "PropertyAssignment",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "facebook.900",
                          kind: "string",
                      },
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "ArrayLiteralExpression",
                              "NumericLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "facebook.900",
                          kind: "string",
                      },
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "Identifier",
                              "NumericLiteral",
                              "Identifier",
                              "VariableDeclaration",
                              "ArrayLiteralExpression",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "pink.100",
                          kind: "string",
                      },
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "Identifier",
                              "NumericLiteral",
                              "Identifier",
                              "VariableDeclaration",
                              "ArrayLiteralExpression",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "pink.100",
                          kind: "string",
                      },
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "Identifier",
                              "NumericLiteral",
                              "Identifier",
                              "VariableDeclaration",
                              "ArrayLiteralExpression",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "pink.100",
                          kind: "string",
                      },
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "Identifier",
                              "NumericLiteral",
                              "Identifier",
                              "VariableDeclaration",
                              "ArrayLiteralExpression",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "pink.100",
                          kind: "string",
                      },
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "Identifier",
                              "NumericLiteral",
                              "Identifier",
                              "VariableDeclaration",
                              "ArrayLiteralExpression",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "pink.100",
                          kind: "string",
                      },
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "ElementAccessExpression",
                              "StringLiteral",
                              "ArrayLiteralExpression",
                              "NumericLiteral",
                              "PropertyAssignment",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "facebook.900",
                          kind: "string",
                      },
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "ElementAccessExpression",
                              "StringLiteral",
                              "ArrayLiteralExpression",
                              "NumericLiteral",
                              "PropertyAssignment",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "facebook.900",
                          kind: "string",
                      },
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "ElementAccessExpression",
                              "StringLiteral",
                              "ArrayLiteralExpression",
                              "NumericLiteral",
                              "PropertyAssignment",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "facebook.900",
                          kind: "string",
                      },
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "gray.100",
                          kind: "string",
                      },
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "gray.100",
                          kind: "string",
                      },
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "gray.100",
                          kind: "string",
                      },
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "gray.100",
                          kind: "string",
                      },
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "gray.100",
                          kind: "string",
                      },
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "gray.100",
                          kind: "string",
                      },
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "gray.100",
                          kind: "string",
                      },
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "gray.100",
                          kind: "string",
                      },
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "gray.100",
                          kind: "string",
                      },
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "gray.100",
                          kind: "string",
                      },
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "gray.100",
                          kind: "string",
                      },
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "Identifier",
                              "ConditionalExpression",
                              "Identifier",
                              "VariableDeclaration",
                              "ObjectLiteralExpression",
                              "Identifier",
                              "VariableDeclaration",
                              "ObjectLiteralExpression",
                          ],
                          type: "conditional",
                          node: "ConditionalExpression",
                          whenTrue: {
                              stack: [
                                  "JsxAttribute",
                                  "JsxExpression",
                                  "ElementAccessExpression",
                                  "Identifier",
                                  "ConditionalExpression",
                                  "Identifier",
                                  "VariableDeclaration",
                                  "PropertyAssignment",
                              ],
                              type: "literal",
                              node: "StringLiteral",
                              value: "gray.600",
                              kind: "string",
                          },
                          whenFalse: {
                              stack: [
                                  "JsxAttribute",
                                  "JsxExpression",
                                  "ElementAccessExpression",
                                  "Identifier",
                                  "ConditionalExpression",
                                  "Identifier",
                                  "VariableDeclaration",
                                  "ObjectLiteralExpression",
                                  "Identifier",
                                  "VariableDeclaration",
                                  "ShorthandPropertyAssignment",
                                  "Identifier",
                                  "VariableDeclaration",
                                  "PropertyAccessExpression",
                                  "Identifier",
                                  "Identifier",
                                  "VariableDeclaration",
                                  "PropertyAssignment",
                              ],
                              type: "literal",
                              node: "StringLiteral",
                              value: "gray.800",
                              kind: "string",
                          },
                          kind: "ternary",
                      },
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ConditionalExpression",
                              "Identifier",
                              "VariableDeclaration",
                          ],
                          type: "conditional",
                          node: "ConditionalExpression",
                          whenTrue: {
                              stack: [
                                  "JsxAttribute",
                                  "JsxExpression",
                                  "ConditionalExpression",
                                  "Identifier",
                                  "Identifier",
                                  "Identifier",
                                  "VariableDeclaration",
                                  "Identifier",
                                  "VariableDeclaration",
                                  "PropertyAssignment",
                              ],
                              type: "literal",
                              node: "StringLiteral",
                              value: "gray.700",
                              kind: "string",
                          },
                          whenFalse: {
                              stack: [
                                  "JsxAttribute",
                                  "JsxExpression",
                                  "Identifier",
                                  "Identifier",
                                  "VariableDeclaration",
                                  "StringLiteral",
                              ],
                              type: "literal",
                              node: "StringLiteral",
                              value: "gray.100",
                              kind: "string",
                          },
                          kind: "ternary",
                      },
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "gray.100",
                          kind: "string",
                      },
                      {
                          stack: ["PropertyAssignment", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "facebook.100",
                          kind: "string",
                      },
                      {
                          stack: [
                              "Identifier",
                              "VariableDeclaration",
                              "ObjectLiteralExpression",
                              "PropertyAssignment",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "blackAlpha.400",
                          kind: "string",
                      },
                      {
                          stack: [
                              "Identifier",
                              "VariableDeclaration",
                              "ObjectLiteralExpression",
                              "PropertyAssignment",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "blackAlpha.400",
                          kind: "string",
                      },
                      {
                          stack: ["PropertyAssignment", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "facebook.200",
                          kind: "string",
                      },
                      {
                          stack: ["PropertyAssignment", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "facebook.200",
                          kind: "string",
                      },
                      {
                          stack: ["Identifier", "BindingElement", "PropertyAssignment", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "facebook.300",
                          kind: "string",
                      },
                      {
                          stack: [],
                          type: "literal",
                          node: "CallExpression",
                          value: "twitter.100",
                          kind: "string",
                      },
                      {
                          stack: ["PropertyAssignment", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "orange.100",
                          kind: "string",
                      },
                      {
                          stack: ["PropertyAssignment", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "orange.200",
                          kind: "string",
                      },
                      {
                          stack: ["PropertyAssignment", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "orange.400",
                          kind: "string",
                      },
                      {
                          stack: ["PropertyAssignment", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "telegram.300",
                          kind: "string",
                      },
                      {
                          stack: ["JsxAttribute", "JsxExpression", "ObjectLiteralExpression"],
                          type: "map",
                          node: "ObjectLiteralExpression",
                          value: {
                              default: {
                                  stack: [
                                      "JsxAttribute",
                                      "JsxExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "StringLiteral",
                                  ],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "red.100",
                                  kind: "string",
                              },
                              hover: {
                                  stack: [
                                      "JsxAttribute",
                                      "JsxExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "StringLiteral",
                                  ],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "green.100",
                                  kind: "string",
                              },
                              focus: {
                                  stack: [
                                      "JsxAttribute",
                                      "JsxExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "StringLiteral",
                                  ],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "blue.100",
                                  kind: "string",
                              },
                          },
                      },
                      {
                          stack: ["JsxAttribute", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "facebook.900",
                          kind: "string",
                      },
                      {
                          stack: ["JsxAttribute", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "facebook.900",
                          kind: "string",
                      },
                      {
                          stack: ["JsxAttribute", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "facebook.900",
                          kind: "string",
                      },
                      {
                          stack: ["JsxAttribute", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "red.100",
                          kind: "string",
                      },
                      {
                          stack: ["JsxAttribute", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "red.100",
                          kind: "string",
                      },
                      {
                          stack: ["JsxAttribute", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "green.100",
                          kind: "string",
                      },
                      {
                          stack: ["JsxAttribute", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "blue.100",
                          kind: "string",
                      },
                      {
                          stack: ["JsxAttribute", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "yellow.100",
                          kind: "string",
                      },
                      {
                          stack: ["JsxAttribute", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "orange.100",
                          kind: "string",
                      },
                      {
                          stack: ["JsxAttribute", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "orange.300",
                          kind: "string",
                      },
                      {
                          stack: ["JsxAttribute", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "red.100",
                          kind: "string",
                      },
                      {
                          stack: ["JsxAttribute", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "orange.400",
                          kind: "string",
                      },
                  ],
                  backgroundColor: [
                      {
                          stack: ["JsxAttribute", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "blackAlpha.100",
                          kind: "string",
                      },
                      {
                          stack: ["PropertyAssignment", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "blackAlpha.100",
                          kind: "string",
                      },
                      {
                          stack: [],
                          type: "literal",
                          node: "CallExpression",
                          value: "twitter.200",
                          kind: "string",
                      },
                      {
                          stack: ["SpreadAssignment", "CallExpression"],
                          type: "literal",
                          node: "CallExpression",
                          value: "twitter.200",
                          kind: "string",
                      },
                      {
                          stack: ["PropertyAssignment", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "telegram.400",
                          kind: "string",
                      },
                      {
                          stack: ["JsxAttribute", "JsxExpression", "ObjectLiteralExpression"],
                          type: "map",
                          node: "ObjectLiteralExpression",
                          value: {
                              default: {
                                  stack: [
                                      "JsxAttribute",
                                      "JsxExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "StringLiteral",
                                  ],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "orange.800",
                                  kind: "string",
                              },
                              hover: {
                                  stack: [
                                      "JsxAttribute",
                                      "JsxExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "StringLiteral",
                                  ],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "telegram.200",
                                  kind: "string",
                              },
                              focus: {
                                  stack: [
                                      "JsxAttribute",
                                      "JsxExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "StringLiteral",
                                  ],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "yellow.700",
                                  kind: "string",
                              },
                          },
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > StringLiteral (multiple)', () => {
  expect(extractFromCode(`<ColorBox color="red.200" backgroundColor="blackAlpha.100"></ColorBox>`))
    .toMatchInlineSnapshot(`
          [
              [
                  "ColorBox",
                  [
                      ["color", "red.200"],
                      ["backgroundColor", "blackAlpha.100"],
                  ],
                  {
                      color: [
                          {
                              stack: ["JsxAttribute", "StringLiteral"],
                              type: "literal",
                              node: "StringLiteral",
                              value: "red.200",
                              kind: "string",
                          },
                      ],
                      backgroundColor: [
                          {
                              stack: ["JsxAttribute", "StringLiteral"],
                              type: "literal",
                              node: "StringLiteral",
                              value: "blackAlpha.100",
                              kind: "string",
                          },
                      ],
                  },
              ],
          ]
        `)
})

it('minimal - groups extract props in parent component instance', () => {
  const extracted = getExtract(
    `
    <ColorBox color="red.200" />
    <ColorBox color="yellow.300" backgroundColor="blackAlpha.100" {...{ display: "flex", color: "blue.100", ...someCond ? { flexDirection: "row", alignItems: "flex-start" } : { flexDirection: "column", justifyAlign: "center" }} } />
    children
</ColorBox>
    `,
    { tagNameList: ['ColorBox'] },
  )
  expect(extracted.get('ColorBox')!.queryList).toMatchInlineSnapshot(`
      [
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxSelfClosingElement",
                  value: {
                      color: {
                          stack: ["JsxAttribute", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "red.200",
                          kind: "string",
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxSelfClosingElement",
                  value: {
                      color: {
                          stack: ["JsxAttribute", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "yellow.300",
                          kind: "string",
                      },
                      backgroundColor: {
                          stack: ["JsxAttribute", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "blackAlpha.100",
                          kind: "string",
                      },
                      _SPREAD_2_0: {
                          stack: ["JsxSelfClosingElement"],
                          type: "map",
                          node: "JsxSpreadAttribute",
                          value: {
                              display: {
                                  stack: ["PropertyAssignment", "StringLiteral"],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "flex",
                                  kind: "string",
                              },
                              color: {
                                  stack: ["PropertyAssignment", "StringLiteral"],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "blue.100",
                                  kind: "string",
                              },
                          },
                          spreadConditions: [
                              {
                                  stack: ["SpreadAssignment", "ConditionalExpression"],
                                  type: "conditional",
                                  node: "ConditionalExpression",
                                  whenTrue: {
                                      stack: ["SpreadAssignment", "ConditionalExpression"],
                                      type: "map",
                                      node: "ObjectLiteralExpression",
                                      value: {
                                          flexDirection: {
                                              stack: [
                                                  "SpreadAssignment",
                                                  "ConditionalExpression",
                                                  "PropertyAssignment",
                                                  "StringLiteral",
                                              ],
                                              type: "literal",
                                              node: "StringLiteral",
                                              value: "row",
                                              kind: "string",
                                          },
                                          alignItems: {
                                              stack: [
                                                  "SpreadAssignment",
                                                  "ConditionalExpression",
                                                  "PropertyAssignment",
                                                  "StringLiteral",
                                              ],
                                              type: "literal",
                                              node: "StringLiteral",
                                              value: "flex-start",
                                              kind: "string",
                                          },
                                      },
                                  },
                                  whenFalse: {
                                      stack: ["SpreadAssignment", "ConditionalExpression"],
                                      type: "map",
                                      node: "ObjectLiteralExpression",
                                      value: {
                                          flexDirection: {
                                              stack: [
                                                  "SpreadAssignment",
                                                  "ConditionalExpression",
                                                  "PropertyAssignment",
                                                  "StringLiteral",
                                              ],
                                              type: "literal",
                                              node: "StringLiteral",
                                              value: "column",
                                              kind: "string",
                                          },
                                          justifyAlign: {
                                              stack: [
                                                  "SpreadAssignment",
                                                  "ConditionalExpression",
                                                  "PropertyAssignment",
                                                  "StringLiteral",
                                              ],
                                              type: "literal",
                                              node: "StringLiteral",
                                              value: "center",
                                              kind: "string",
                                          },
                                      },
                                  },
                                  kind: "ternary",
                              },
                          ],
                      },
                  },
              },
          },
      ]
    `)
})

it('ExtractSample - groups extract props in parent component instance', () => {
  const extracted = getExtract(ExtractSample, { tagNameList: ['ColorBox'] })
  expect(extracted.get('ColorBox')!.queryList).toMatchInlineSnapshot(`
      [
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxSelfClosingElement",
                  value: {
                      color: {
                          stack: ["JsxAttribute", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "red.200",
                          kind: "string",
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      color: {
                          stack: ["JsxAttribute", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "yellow.300",
                          kind: "string",
                      },
                      backgroundColor: {
                          stack: ["JsxAttribute", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "blackAlpha.100",
                          kind: "string",
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      color: {
                          stack: ["JsxAttribute", "JsxExpression", "ConditionalExpression"],
                          type: "conditional",
                          node: "ConditionalExpression",
                          whenTrue: {
                              stack: ["JsxAttribute", "JsxExpression", "ConditionalExpression"],
                              type: "literal",
                              node: "StringLiteral",
                              value: "cyan.400",
                              kind: "string",
                          },
                          whenFalse: {
                              stack: ["JsxAttribute", "JsxExpression", "ConditionalExpression"],
                              type: "literal",
                              node: "StringLiteral",
                              value: "cyan.500",
                              kind: "string",
                          },
                          kind: "ternary",
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      color: {
                          stack: ["JsxAttribute", "JsxExpression", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "facebook.400",
                          kind: "string",
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      color: {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "gray.100",
                          kind: "string",
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      color: {
                          stack: ["JsxAttribute", "JsxExpression", "ConditionalExpression"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "facebook.500",
                          kind: "string",
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      color: {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ConditionalExpression",
                              "Identifier",
                              "VariableDeclaration",
                          ],
                          type: "conditional",
                          node: "ConditionalExpression",
                          whenTrue: {
                              stack: ["JsxAttribute", "JsxExpression", "ConditionalExpression"],
                              type: "literal",
                              node: "StringLiteral",
                              value: "facebook.600",
                              kind: "string",
                          },
                          whenFalse: {
                              stack: [
                                  "JsxAttribute",
                                  "JsxExpression",
                                  "ConditionalExpression",
                                  "Identifier",
                                  "VariableDeclaration",
                                  "StringLiteral",
                              ],
                              type: "literal",
                              node: "StringLiteral",
                              value: "gray.200",
                              kind: "string",
                          },
                          kind: "ternary",
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      color: {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ConditionalExpression",
                              "Identifier",
                              "VariableDeclaration",
                              "Identifier",
                              "VariableDeclaration",
                          ],
                          type: "conditional",
                          node: "ConditionalExpression",
                          whenTrue: {
                              stack: [
                                  "JsxAttribute",
                                  "JsxExpression",
                                  "ConditionalExpression",
                                  "Identifier",
                                  "VariableDeclaration",
                                  "StringLiteral",
                              ],
                              type: "literal",
                              node: "StringLiteral",
                              value: "gray.200",
                              kind: "string",
                          },
                          whenFalse: {
                              stack: [
                                  "JsxAttribute",
                                  "JsxExpression",
                                  "ConditionalExpression",
                                  "Identifier",
                                  "VariableDeclaration",
                                  "Identifier",
                                  "VariableDeclaration",
                                  "StringLiteral",
                              ],
                              type: "literal",
                              node: "StringLiteral",
                              value: "gray.300",
                              kind: "string",
                          },
                          kind: "ternary",
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      color: {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "gray.100",
                          kind: "string",
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      color: {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "ObjectLiteralExpression",
                              "StringLiteral",
                              "PropertyAssignment",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "facebook.900",
                          kind: "string",
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      color: {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "ArrayLiteralExpression",
                              "NumericLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "facebook.900",
                          kind: "string",
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      color: {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "Identifier",
                              "NumericLiteral",
                              "Identifier",
                              "VariableDeclaration",
                              "ArrayLiteralExpression",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "pink.100",
                          kind: "string",
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      color: {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "Identifier",
                              "NumericLiteral",
                              "Identifier",
                              "VariableDeclaration",
                              "ArrayLiteralExpression",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "pink.100",
                          kind: "string",
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      color: {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "Identifier",
                              "NumericLiteral",
                              "Identifier",
                              "VariableDeclaration",
                              "ArrayLiteralExpression",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "pink.100",
                          kind: "string",
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      color: {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "Identifier",
                              "NumericLiteral",
                              "Identifier",
                              "VariableDeclaration",
                              "ArrayLiteralExpression",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "pink.100",
                          kind: "string",
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      color: {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "Identifier",
                              "NumericLiteral",
                              "Identifier",
                              "VariableDeclaration",
                              "ArrayLiteralExpression",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "pink.100",
                          kind: "string",
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      color: {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "ElementAccessExpression",
                              "StringLiteral",
                              "ArrayLiteralExpression",
                              "NumericLiteral",
                              "PropertyAssignment",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "facebook.900",
                          kind: "string",
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      color: {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "ElementAccessExpression",
                              "StringLiteral",
                              "ArrayLiteralExpression",
                              "NumericLiteral",
                              "PropertyAssignment",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "facebook.900",
                          kind: "string",
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      color: {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "ElementAccessExpression",
                              "StringLiteral",
                              "ArrayLiteralExpression",
                              "NumericLiteral",
                              "PropertyAssignment",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "facebook.900",
                          kind: "string",
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      color: {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "gray.100",
                          kind: "string",
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      color: {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "gray.100",
                          kind: "string",
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      color: {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "gray.100",
                          kind: "string",
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      color: {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "gray.100",
                          kind: "string",
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      color: {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "gray.100",
                          kind: "string",
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      color: {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "gray.100",
                          kind: "string",
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      color: {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "gray.100",
                          kind: "string",
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      color: {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "gray.100",
                          kind: "string",
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      color: {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "gray.100",
                          kind: "string",
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      color: {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "gray.100",
                          kind: "string",
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      color: {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "gray.100",
                          kind: "string",
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      color: {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "Identifier",
                              "ConditionalExpression",
                              "Identifier",
                              "VariableDeclaration",
                              "ObjectLiteralExpression",
                              "Identifier",
                              "VariableDeclaration",
                              "ObjectLiteralExpression",
                          ],
                          type: "conditional",
                          node: "ConditionalExpression",
                          whenTrue: {
                              stack: [
                                  "JsxAttribute",
                                  "JsxExpression",
                                  "ElementAccessExpression",
                                  "Identifier",
                                  "ConditionalExpression",
                                  "Identifier",
                                  "VariableDeclaration",
                                  "PropertyAssignment",
                              ],
                              type: "literal",
                              node: "StringLiteral",
                              value: "gray.600",
                              kind: "string",
                          },
                          whenFalse: {
                              stack: [
                                  "JsxAttribute",
                                  "JsxExpression",
                                  "ElementAccessExpression",
                                  "Identifier",
                                  "ConditionalExpression",
                                  "Identifier",
                                  "VariableDeclaration",
                                  "ObjectLiteralExpression",
                                  "Identifier",
                                  "VariableDeclaration",
                                  "ShorthandPropertyAssignment",
                                  "Identifier",
                                  "VariableDeclaration",
                                  "PropertyAccessExpression",
                                  "Identifier",
                                  "Identifier",
                                  "VariableDeclaration",
                                  "PropertyAssignment",
                              ],
                              type: "literal",
                              node: "StringLiteral",
                              value: "gray.800",
                              kind: "string",
                          },
                          kind: "ternary",
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      color: {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ConditionalExpression",
                              "Identifier",
                              "VariableDeclaration",
                          ],
                          type: "conditional",
                          node: "ConditionalExpression",
                          whenTrue: {
                              stack: [
                                  "JsxAttribute",
                                  "JsxExpression",
                                  "ConditionalExpression",
                                  "Identifier",
                                  "Identifier",
                                  "Identifier",
                                  "VariableDeclaration",
                                  "Identifier",
                                  "VariableDeclaration",
                                  "PropertyAssignment",
                              ],
                              type: "literal",
                              node: "StringLiteral",
                              value: "gray.700",
                              kind: "string",
                          },
                          whenFalse: {
                              stack: [
                                  "JsxAttribute",
                                  "JsxExpression",
                                  "Identifier",
                                  "Identifier",
                                  "VariableDeclaration",
                                  "StringLiteral",
                              ],
                              type: "literal",
                              node: "StringLiteral",
                              value: "gray.100",
                              kind: "string",
                          },
                          kind: "ternary",
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      color: {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "gray.100",
                          kind: "string",
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      _SPREAD_0_0: {
                          stack: ["JsxOpeningElement"],
                          type: "map",
                          node: "JsxSpreadAttribute",
                          value: {
                              color: {
                                  stack: ["PropertyAssignment", "StringLiteral"],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "facebook.100",
                                  kind: "string",
                              },
                          },
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      _SPREAD_0_0: {
                          stack: ["JsxOpeningElement"],
                          type: "map",
                          node: "JsxSpreadAttribute",
                          value: {
                              color: {
                                  stack: [
                                      "Identifier",
                                      "VariableDeclaration",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "StringLiteral",
                                  ],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "blackAlpha.400",
                                  kind: "string",
                              },
                          },
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      _SPREAD_0_0: {
                          stack: ["JsxOpeningElement"],
                          type: "map",
                          node: "JsxSpreadAttribute",
                          value: {
                              color: {
                                  stack: [
                                      "Identifier",
                                      "VariableDeclaration",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "StringLiteral",
                                  ],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "blackAlpha.400",
                                  kind: "string",
                              },
                          },
                      },
                      _SPREAD_0_1: {
                          stack: ["Identifier", "VariableDeclaration"],
                          type: "literal",
                          node: "NullKeyword",
                          value: null,
                          kind: "null",
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      _SPREAD_0_0: {
                          stack: ["JsxOpeningElement"],
                          type: "map",
                          node: "JsxSpreadAttribute",
                          value: {
                              color: {
                                  stack: ["PropertyAssignment", "StringLiteral"],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "facebook.200",
                                  kind: "string",
                              },
                              backgroundColor: {
                                  stack: ["PropertyAssignment", "StringLiteral"],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "blackAlpha.100",
                                  kind: "string",
                              },
                              borderColor: {
                                  stack: [
                                      "PropertyAssignment",
                                      "Identifier",
                                      "Identifier",
                                      "VariableDeclaration",
                                      "StringLiteral",
                                  ],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "blackAlpha.300",
                                  kind: "string",
                              },
                          },
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      _SPREAD_0_0: {
                          stack: ["JsxOpeningElement"],
                          type: "map",
                          node: "JsxSpreadAttribute",
                          value: {
                              color: {
                                  stack: ["PropertyAssignment", "StringLiteral"],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "facebook.200",
                                  kind: "string",
                              },
                          },
                      },
                      _SPREAD_0_1: {
                          stack: [],
                          type: "literal",
                          node: "Identifier",
                          kind: "undefined",
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      _SPREAD_0_0: {
                          stack: ["JsxOpeningElement"],
                          type: "map",
                          node: "JsxSpreadAttribute",
                          value: {
                              color: {
                                  stack: ["Identifier", "BindingElement", "PropertyAssignment", "StringLiteral"],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "facebook.300",
                                  kind: "string",
                              },
                          },
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      _SPREAD_0_0: {
                          stack: ["JsxOpeningElement"],
                          type: "map",
                          node: "JsxSpreadAttribute",
                          value: {
                              color: {
                                  stack: [],
                                  type: "literal",
                                  node: "CallExpression",
                                  value: "twitter.100",
                                  kind: "string",
                              },
                              backgroundColor: {
                                  stack: [],
                                  type: "literal",
                                  node: "CallExpression",
                                  value: "twitter.200",
                                  kind: "string",
                              },
                          },
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      _SPREAD_0_0: {
                          stack: ["JsxOpeningElement"],
                          type: "map",
                          node: "JsxSpreadAttribute",
                          value: {
                              backgroundColor: {
                                  stack: ["SpreadAssignment", "CallExpression"],
                                  type: "literal",
                                  node: "CallExpression",
                                  value: "twitter.200",
                                  kind: "string",
                              },
                              color: {
                                  stack: ["PropertyAssignment", "StringLiteral"],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "orange.100",
                                  kind: "string",
                              },
                          },
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      _SPREAD_0_0: {
                          stack: ["JsxOpeningElement"],
                          type: "map",
                          node: "JsxSpreadAttribute",
                          value: {
                              color: {
                                  stack: ["PropertyAssignment", "StringLiteral"],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "orange.200",
                                  kind: "string",
                              },
                          },
                          spreadConditions: [
                              {
                                  stack: ["SpreadAssignment", "ConditionalExpression"],
                                  type: "conditional",
                                  node: "ConditionalExpression",
                                  whenTrue: {
                                      stack: ["SpreadAssignment", "ConditionalExpression"],
                                      type: "object",
                                      node: "CallExpression",
                                      value: {
                                          color: "twitter.100",
                                          backgroundColor: "twitter.200",
                                      },
                                  },
                                  whenFalse: {
                                      stack: ["SpreadAssignment", "ConditionalExpression"],
                                      type: "map",
                                      node: "ObjectLiteralExpression",
                                      value: {
                                          color: {
                                              stack: [
                                                  "SpreadAssignment",
                                                  "ConditionalExpression",
                                                  "PropertyAssignment",
                                                  "StringLiteral",
                                              ],
                                              type: "literal",
                                              node: "StringLiteral",
                                              value: "never.150",
                                              kind: "string",
                                          },
                                      },
                                  },
                                  kind: "ternary",
                              },
                          ],
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      _SPREAD_0_0: {
                          stack: ["JsxOpeningElement"],
                          type: "map",
                          node: "JsxSpreadAttribute",
                          value: {
                              color: {
                                  stack: ["PropertyAssignment", "StringLiteral"],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "orange.400",
                                  kind: "string",
                              },
                          },
                          spreadConditions: [
                              {
                                  stack: ["SpreadAssignment", "ConditionalExpression"],
                                  type: "conditional",
                                  node: "ConditionalExpression",
                                  whenTrue: {
                                      stack: ["SpreadAssignment", "ConditionalExpression"],
                                      type: "object",
                                      node: "CallExpression",
                                      value: {
                                          color: "twitter.100",
                                          backgroundColor: "twitter.200",
                                      },
                                  },
                                  whenFalse: {
                                      stack: ["SpreadAssignment", "ConditionalExpression"],
                                      type: "map",
                                      node: "ObjectLiteralExpression",
                                      value: {
                                          borderColor: {
                                              stack: [
                                                  "SpreadAssignment",
                                                  "ConditionalExpression",
                                                  "PropertyAssignment",
                                                  "Identifier",
                                                  "Identifier",
                                                  "VariableDeclaration",
                                                  "StringLiteral",
                                              ],
                                              type: "literal",
                                              node: "StringLiteral",
                                              value: "orange.300",
                                              kind: "string",
                                          },
                                      },
                                  },
                                  kind: "ternary",
                              },
                          ],
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      _SPREAD_0_0: {
                          stack: ["JsxOpeningElement"],
                          type: "map",
                          node: "JsxSpreadAttribute",
                          value: {
                              color: {
                                  stack: ["PropertyAssignment", "StringLiteral"],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "telegram.300",
                                  kind: "string",
                              },
                              backgroundColor: {
                                  stack: ["PropertyAssignment", "StringLiteral"],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "telegram.400",
                                  kind: "string",
                              },
                          },
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      color: {
                          stack: ["JsxAttribute", "JsxExpression", "ObjectLiteralExpression"],
                          type: "map",
                          node: "ObjectLiteralExpression",
                          value: {
                              default: {
                                  stack: [
                                      "JsxAttribute",
                                      "JsxExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "StringLiteral",
                                  ],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "red.100",
                                  kind: "string",
                              },
                              hover: {
                                  stack: [
                                      "JsxAttribute",
                                      "JsxExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "StringLiteral",
                                  ],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "green.100",
                                  kind: "string",
                              },
                              focus: {
                                  stack: [
                                      "JsxAttribute",
                                      "JsxExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "StringLiteral",
                                  ],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "blue.100",
                                  kind: "string",
                              },
                          },
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      backgroundColor: {
                          stack: ["JsxAttribute", "JsxExpression", "ObjectLiteralExpression"],
                          type: "map",
                          node: "ObjectLiteralExpression",
                          value: {
                              default: {
                                  stack: [
                                      "JsxAttribute",
                                      "JsxExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "StringLiteral",
                                  ],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "orange.800",
                                  kind: "string",
                              },
                              hover: {
                                  stack: [
                                      "JsxAttribute",
                                      "JsxExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "StringLiteral",
                                  ],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "telegram.200",
                                  kind: "string",
                              },
                              focus: {
                                  stack: [
                                      "JsxAttribute",
                                      "JsxExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "StringLiteral",
                                  ],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "yellow.700",
                                  kind: "string",
                              },
                          },
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      color: {
                          stack: ["JsxAttribute", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "facebook.900",
                          kind: "string",
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      color: {
                          stack: ["JsxAttribute", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "facebook.900",
                          kind: "string",
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      color: {
                          stack: ["JsxAttribute", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "facebook.900",
                          kind: "string",
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      color: {
                          stack: ["JsxAttribute", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "red.100",
                          kind: "string",
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxOpeningElement",
                  value: {
                      color: {
                          stack: ["JsxAttribute", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "red.100",
                          kind: "string",
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxSelfClosingElement",
                  value: {
                      color: {
                          stack: ["JsxAttribute", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "green.100",
                          kind: "string",
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxSelfClosingElement",
                  value: {
                      color: {
                          stack: ["JsxAttribute", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "blue.100",
                          kind: "string",
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxSelfClosingElement",
                  value: {
                      color: {
                          stack: ["JsxAttribute", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "yellow.100",
                          kind: "string",
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxSelfClosingElement",
                  value: {
                      color: {
                          stack: ["JsxAttribute", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "orange.100",
                          kind: "string",
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxSelfClosingElement",
                  value: {
                      color: {
                          stack: ["JsxAttribute", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "orange.300",
                          kind: "string",
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxSelfClosingElement",
                  value: {
                      color: {
                          stack: ["JsxAttribute", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "red.100",
                          kind: "string",
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              box: {
                  stack: [],
                  type: "map",
                  node: "JsxSelfClosingElement",
                  value: {
                      color: {
                          stack: ["JsxAttribute", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "orange.400",
                          kind: "string",
                      },
                  },
              },
          },
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > StringLiteral', () => {
  expect(extractFromCode(`<ColorBox color={"red.300"}></ColorBox>`)).toMatchInlineSnapshot(
    `
      [
          [
              "ColorBox",
              [["color", "red.300"]],
              {
                  color: [
                      {
                          stack: ["JsxAttribute", "JsxExpression", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "red.300",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `,
  )
})

it('extract JsxAttribute > JsxExpression > Identifier', () => {
  expect(
    extractFromCode(`
            const color = "red.400";
            <ColorBox color={color}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "red.400"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "red.400",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ConditonalExpression > Identifier|Value', () => {
  expect(
    extractFromCode(`
            const darkValue = "red.500";
            <ColorBox color={isDark ? darkValue : "whiteAlpha.100"}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", ["red.500", "whiteAlpha.100"]]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ConditionalExpression",
                              "Identifier",
                              "VariableDeclaration",
                          ],
                          type: "conditional",
                          node: "ConditionalExpression",
                          whenTrue: {
                              stack: [
                                  "JsxAttribute",
                                  "JsxExpression",
                                  "ConditionalExpression",
                                  "Identifier",
                                  "VariableDeclaration",
                                  "StringLiteral",
                              ],
                              type: "literal",
                              node: "StringLiteral",
                              value: "red.500",
                              kind: "string",
                          },
                          whenFalse: {
                              stack: [
                                  "JsxAttribute",
                                  "JsxExpression",
                                  "ConditionalExpression",
                                  "Identifier",
                                  "VariableDeclaration",
                              ],
                              type: "literal",
                              node: "StringLiteral",
                              value: "whiteAlpha.100",
                              kind: "string",
                          },
                          kind: "ternary",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ElementAccessExpression', () => {
  expect(
    extractFromCode(`
            const colorMap = {
                red: "red.600",
            } as const;
            <ColorBox color={colorMap["red"]}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "red.600"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "Identifier",
                              "StringLiteral",
                              "Identifier",
                              "VariableDeclaration",
                              "PropertyAssignment",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "red.600",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ElementAccessExpression without as const', () => {
  expect(
    extractFromCode(`
            const colorMap = {
                red: "red.600",
            };
            <ColorBox color={colorMap["red"]}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "red.600"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "Identifier",
                              "StringLiteral",
                              "Identifier",
                              "VariableDeclaration",
                              "PropertyAssignment",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "red.600",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ElementAccessExpression optional', () => {
  expect(
    extractFromCode(`
            const colorMap = {
                red: "red.700",
            } as const;
            <ColorBox color={colorMap?.["red"]}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "red.700"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "Identifier",
                              "StringLiteral",
                              "Identifier",
                              "VariableDeclaration",
                              "PropertyAssignment",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "red.700",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ElementAccessExpression optional without as const', () => {
  expect(
    extractFromCode(`
            const colorMap = {
                red: "red.700",
            };
            <ColorBox color={colorMap?.["red"]}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "red.700"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "Identifier",
                              "StringLiteral",
                              "Identifier",
                              "VariableDeclaration",
                              "PropertyAssignment",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "red.700",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ElementAccessExpression > Identifier', () => {
  expect(
    extractFromCode(`
            const propName = "red";
            const colorMap = {
                red: "red.800",
            } as const;
            <ColorBox color={colorMap[propName]}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "red.800"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "Identifier",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "Identifier",
                              "VariableDeclaration",
                              "PropertyAssignment",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "red.800",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ElementAccessExpression > Identifier without as const', () => {
  expect(
    extractFromCode(`
            const propName = "red";
            const colorMap = {
                red: "red.800",
            };
            <ColorBox color={colorMap[propName]}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "red.800"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "Identifier",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "Identifier",
                              "VariableDeclaration",
                              "PropertyAssignment",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "red.800",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ElementAccessExpression > StringLiteral on map with ComputedProperty name', () => {
  expect(
    extractFromCode(`
            const propName = "red";
            const colorMap = {
                [propName]: "red.900",
            } as const;
            <ColorBox color={colorMap["red"]}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "red.900"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "Identifier",
                              "StringLiteral",
                              "Identifier",
                              "VariableDeclaration",
                              "PropertyAssignment",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "red.900",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ElementAccessExpression > StringLiteral on map with ComputedProperty name without  as const', () => {
  expect(
    extractFromCode(`
            const propName = "red";
            const colorMap = {
                [propName]: "red.900",
            };
            <ColorBox color={colorMap["red"]}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "red.900"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "Identifier",
                              "StringLiteral",
                              "Identifier",
                              "VariableDeclaration",
                              "PropertyAssignment",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "red.900",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ElementAccessExpression > ComputedProperty name', () => {
  expect(
    extractFromCode(`
            const propName = "blue";
            const colorMap = {
                [propName]: "blue.100",
            } as const;
            <ColorBox color={colorMap[propName]}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "blue.100"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "Identifier",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "Identifier",
                              "VariableDeclaration",
                              "PropertyAssignment",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "blue.100",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ElementAccessExpression > ComputedProperty name without as const', () => {
  expect(
    extractFromCode(`
            const propName = "blue";
            const colorMap = {
                [propName]: "blue.100",
            };
            <ColorBox color={colorMap[propName]}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "blue.100"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "Identifier",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "Identifier",
                              "VariableDeclaration",
                              "PropertyAssignment",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "blue.100",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > PropertyAccessExpression', () => {
  expect(
    extractFromCode(`
            const colorMap = {
                blue: "blue.200",
            } as const;
            <ColorBox color={colorMap.blue}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "blue.200"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "PropertyAccessExpression",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "PropertyAssignment",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "blue.200",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > PropertyAccessExpression optional', () => {
  expect(
    extractFromCode(`
            const colorMap = {
                blue: "blue.300",
            } as const;
            <ColorBox color={colorMap?.blue}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "blue.300"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "PropertyAccessExpression",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "PropertyAssignment",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "blue.300",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > PropertyAccessExpression optional without as const', () => {
  expect(
    extractFromCode(`
            const colorMap = {
                blue: "blue.300",
            };
            <ColorBox color={colorMap?.blue}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "blue.300"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "PropertyAccessExpression",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "PropertyAssignment",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "blue.300",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ElementAccessExpression > BinaryExpression > StringLiteral', () => {
  expect(
    extractFromCode(`
            const colorMap = {
                longProp: "blue.400",
            } as const;
            <ColorBox color={colorMap["long" + "Prop"]}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "blue.400"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "Identifier",
                              "BinaryExpression",
                              "Identifier",
                              "VariableDeclaration",
                              "PropertyAssignment",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "blue.400",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ElementAccessExpression > BinaryExpression > StringLiteral without as const', () => {
  expect(
    extractFromCode(`
            const colorMap = {
                longProp: "blue.400",
            };
            <ColorBox color={colorMap["long" + "Prop"]}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "blue.400"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "Identifier",
                              "BinaryExpression",
                              "Identifier",
                              "VariableDeclaration",
                              "PropertyAssignment",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "blue.400",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ElementAccessExpression > BinaryExpression > StringLiteral + Identifier without as const', () => {
  expect(
    extractFromCode(`
            const part2 = "Prop";
            const colorMap = {
                longProp: "blue.500",
            };
            <ColorBox color={colorMap["long" + part2]}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "blue.500"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "Identifier",
                              "BinaryExpression",
                              "Identifier",
                              "VariableDeclaration",
                              "Identifier",
                              "VariableDeclaration",
                              "PropertyAssignment",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "blue.500",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ElementAccessExpression > NoSubstitionTemplateLiteral', () => {
  expect(
    extractFromCode(`
            const colorMap = {
                longProp: "blue.600",
            } as const;
            <ColorBox color={colorMap[\`longProp\`]}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "blue.600"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "Identifier",
                              "NoSubstitutionTemplateLiteral",
                              "Identifier",
                              "VariableDeclaration",
                              "PropertyAssignment",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "blue.600",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ElementAccessExpression > NoSubstitionTemplateLiteral without as const', () => {
  expect(
    extractFromCode(`
            const colorMap = {
                longProp: "blue.600",
            };
            <ColorBox color={colorMap[\`longProp\`]}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "blue.600"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "Identifier",
                              "NoSubstitutionTemplateLiteral",
                              "Identifier",
                              "VariableDeclaration",
                              "PropertyAssignment",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "blue.600",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ElementAccessExpression > TemplateStringLiteral & Identifier', () => {
  expect(
    extractFromCode(`
            const part2 = "Prop" as const;
            const colorMap = {
                longProp: "blue.700",
            } as const;
            <ColorBox color={colorMap[\`long\${part2}\`]}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "blue.700"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "Identifier",
                              "TemplateExpression",
                              "Identifier",
                              "VariableDeclaration",
                              "Identifier",
                              "VariableDeclaration",
                              "PropertyAssignment",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "blue.700",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ElementAccessExpression > TemplateStringLiteral > Identifier x2', () => {
  expect(
    extractFromCode(`
            const part1 = "long" as const;
            const part2 = "Prop" as const;
            const colorMap = {
                longProp: "blue.800",
            } as const;
            <ColorBox color={colorMap[\`$\{part1}\${part2}\`]}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "blue.800"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "Identifier",
                              "TemplateExpression",
                              "Identifier",
                              "VariableDeclaration",
                              "Identifier",
                              "VariableDeclaration",
                              "Identifier",
                              "VariableDeclaration",
                              "PropertyAssignment",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "blue.800",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ConditonalExpression > AsExpression (StringLiteral) + Identifier', () => {
  expect(
    extractFromCode(`
            const isDark = true;
            const lightRef = "light" as const;
            const colorMap = {
                dark: "blue.900",
                light: "blue.900",
            } as const;
            <ColorBox color={colorMap[isDark ? ("dark" as const) : lightRef]}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "blue.900"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "Identifier",
                              "ConditionalExpression",
                              "Identifier",
                              "VariableDeclaration",
                              "PropertyAssignment",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "blue.900",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ElementAccessExpression > TemplateStringLiteral + Identifier (StringLiteral)', () => {
  expect(
    extractFromCode(`
            const colorMap = {
                longProp: "green.100",
            } as const;
            <ColorBox color={colorMap["long" + \`\${"Prop"}\`]}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "green.100"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "Identifier",
                              "BinaryExpression",
                              "Identifier",
                              "VariableDeclaration",
                              "PropertyAssignment",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "green.100",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ElementAccessExpression > BinaryExpression > StringLiteral + TemplateStringLiteral > ElementAccessExpression > Identifier (StringLiteral)', () => {
  expect(
    extractFromCode(`
            const dynamic = {
                part2: "Prop",
            } as const;
            const colorMap = {
                longProp: "green.200",
            } as const;
            <ColorBox color={colorMap[("long" as any) + (\`\${dynamic["part2"]}\`) as any]}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "green.200"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "Identifier",
                              "BinaryExpression",
                              "Identifier",
                              "VariableDeclaration",
                              "PropertyAssignment",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "green.200",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ElementAccessExpression > BinaryExpression > PropertyAccessExpression + ElementAccessExpression > Identifier', () => {
  expect(
    extractFromCode(`
            const part2ref = "part2" as const;
            const dynamic = {
                part1: "long",
                part2: "Prop",
            } as const;
            const colorMap = {
                longProp: "green.300",
            } as const;
            <ColorBox color={colorMap[dynamic.part1 + dynamic[part2ref]]}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "green.300"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "Identifier",
                              "BinaryExpression",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "ObjectLiteralExpression",
                              "Identifier",
                              "VariableDeclaration",
                              "PropertyAssignment",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "green.300",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ElementAccessExpression > ObjectLiteralExpression', () => {
  expect(
    extractFromCode(`
            <ColorBox color={{ staticColor: "green.400" }["staticColor"]}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "green.400"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "ObjectLiteralExpression",
                              "StringLiteral",
                              "PropertyAssignment",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "green.400",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ElementAccessExpression (AsExpression) > Identifier (StringLiteral) x2', () => {
  expect(
    extractFromCode(`
            const colorMap = {
                longProp: "green.500",
            };
            <ColorBox color={colorMap["long" + "Prop"] as any}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "green.500"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "Identifier",
                              "BinaryExpression",
                              "Identifier",
                              "VariableDeclaration",
                              "PropertyAssignment",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "green.500",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ElementAccessExpression (AsExpression) > Identifier (StringLiteral) x2 on ShorthandPropertyAssignment', () => {
  expect(
    extractFromCode(`
            const longProp = "green.600"
            const colorMap = {
                longProp,
            };
            <ColorBox color={colorMap["long" + "Prop"] as any}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "green.600"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "Identifier",
                              "BinaryExpression",
                              "Identifier",
                              "VariableDeclaration",
                              "ShorthandPropertyAssignment",
                              "Identifier",
                              "VariableDeclaration",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "green.600",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ElementAccessExpression > BinaryExpression > StringLiteral (AsExpression) + TemplateStringLiteral > Identifier (StringLiteral) (AsExpression)', () => {
  expect(
    extractFromCode(`
            const dynamicPart2 = "Prop";
            const withDynamicPart = {
                dynamicPart2: dynamicPart2,
            };
            const longProp = "green.700"
            const colorMap = {
                longProp,
            };
            <ColorBox color={colorMap[("long" as any) + \`\${withDynamicPart["dynamicPart2"]}\`] as any}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "green.700"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "Identifier",
                              "BinaryExpression",
                              "Identifier",
                              "VariableDeclaration",
                              "ShorthandPropertyAssignment",
                              "Identifier",
                              "VariableDeclaration",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "green.700",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ElementAccessExpression > ElementAccessExpression > Identifier > Identifier', () => {
  expect(
    extractFromCode(`
            const dynamicElement = "longProp";
            const secondRef = "secondLevel";
            const wrapperMap = {
                [secondRef]: dynamicElement,
            };
            const longProp = "green.800"
            const colorMap = {
                longProp,
            };
            <ColorBox color={colorMap[wrapperMap[secondRef]]}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "green.800"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "Identifier",
                              "ElementAccessExpression",
                              "Identifier",
                              "VariableDeclaration",
                              "ShorthandPropertyAssignment",
                              "Identifier",
                              "VariableDeclaration",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "green.800",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ElementAccessExpression > ArrayLiteralExpression > NumericLiteral', () => {
  expect(
    extractFromCode(`
            <ColorBox color={["green.900"][0]}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "green.900"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "ArrayLiteralExpression",
                              "NumericLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "green.900",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ElementAccessExpression > ArrayLiteralExpression > StringLiteral', () => {
  expect(
    extractFromCode(`
            <ColorBox color={["pink.100"]["0"]}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "pink.100"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "ArrayLiteralExpression",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "pink.100",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ElementAccessExpression > ArrayLiteralExpression > Identifier > NumericLiteral', () => {
  expect(
    extractFromCode(`
            const nbIndex = 1;
            <ColorBox color={["pink.100", "pink.200"][nbIndex]}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "pink.200"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "ArrayLiteralExpression",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "pink.200",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ElementAccessExpression > ArrayLiteralExpression > Identifier > StringLiteral', () => {
  expect(
    extractFromCode(`
            const strIndex = "0";
            <ColorBox color={["pink.300"][strIndex]}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "pink.300"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "ArrayLiteralExpression",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "pink.300",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ElementAccessExpression > ParenthesizedExpression > AsExpression > NumericLiteral', () => {
  expect(
    extractFromCode(`
            const array = ["pink.400"];
            <ColorBox color={(array as any)?.[0] as any}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "pink.400"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "Identifier",
                              "NumericLiteral",
                              "Identifier",
                              "VariableDeclaration",
                              "ArrayLiteralExpression",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "pink.400",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ArrayLiteralExpression > ElementAccessExpression > NonNullExpression > ElementAccessExpression > NumericLiteral', () => {
  expect(
    extractFromCode(`
            const array = ["pink.500"];
            <ColorBox color={[array[0]]![0]}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "pink.500"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "ArrayLiteralExpression",
                              "NumericLiteral",
                              "Identifier",
                              "NumericLiteral",
                              "Identifier",
                              "VariableDeclaration",
                              "ArrayLiteralExpression",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "pink.500",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ElementAccessExpression > ElementAccessExpression > ArrayLiteralExpression > ObjectLiteralExpresssion > PropertyAssignment > StringLiteral', () => {
  expect(
    extractFromCode(`
            <ColorBox color={[{ staticColor: "pink.600" }][0]["staticColor"]}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "pink.600"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "ElementAccessExpression",
                              "StringLiteral",
                              "ArrayLiteralExpression",
                              "NumericLiteral",
                              "PropertyAssignment",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "pink.600",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ConditionalExpression', () => {
  expect(
    extractFromCode(`
            const isShown = true;
            const dynamicColorName = "something";
            const nestedReference = { ref: dynamicColorName } as const;
            const deepReference = nestedReference.ref;

            const colorMap = {
                literalColor: "pink.700",
                [deepReference]: "pink.800",
            };

            <ColorBox color={colorMap[!isShown ? ("literalColor" as const) : deepReference] as any}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "pink.800"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "Identifier",
                              "ConditionalExpression",
                              "Identifier",
                              "VariableDeclaration",
                              "PropertyAssignment",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "pink.800",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ElementAccessExpression > TemplateExpression > Identifier > TemplateExpression', () => {
  expect(
    extractFromCode(`
            const dynamicPart1 = "long";
            const dynamicPart2 = "Prop";
            const dynamicPartsAsTemplateString = \`\${dynamicPart1}\${dynamicPart2}\` as const;

            const longProp = "pink.900"
            const colorMap = {
                longProp,
            };
            <ColorBox color={colorMap[\`\${dynamicPartsAsTemplateString}\`] as any}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "pink.900"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "Identifier",
                              "TemplateExpression",
                              "Identifier",
                              "VariableDeclaration",
                              "Identifier",
                              "VariableDeclaration",
                              "ShorthandPropertyAssignment",
                              "Identifier",
                              "VariableDeclaration",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "pink.900",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ElementAccessExpression > TemplateExpression > Identifier > TemplateExpression without as const', () => {
  expect(
    extractFromCode(`
            const dynamicPart1 = "long";
            const dynamicPart2 = "Prop";
            const dynamicPartsAsTemplateString = \`\${dynamicPart1}\${dynamicPart2}\`;

            const longProp = "pink.900"
            const colorMap = {
                longProp,
            };
            <ColorBox color={colorMap[\`\${dynamicPartsAsTemplateString}\`] as any}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "pink.900"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "Identifier",
                              "TemplateExpression",
                              "Identifier",
                              "VariableDeclaration",
                              "Identifier",
                              "VariableDeclaration",
                              "ShorthandPropertyAssignment",
                              "Identifier",
                              "VariableDeclaration",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "pink.900",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ElementAccessExpression > BinaryExpression > PropertyAccessExpression + ElementAccessExpression', () => {
  expect(
    extractFromCode(`
            const dynamicElement = "longProp";
            const secondRef = "secondLevel";

            const dynamicPart1 = "long";
            const dynamicPart2 = "Prop";
            const withDynamicPart = {
                dynamicPart1,
                dynamicPart2: dynamicPart2,
            };

            const wrapperMap = {
                [secondRef]: dynamicElement,
                thirdRef: withDynamicPart.dynamicPart1,
                fourthRef: withDynamicPart["dynamicPart2"],
            };
            const longProp = "yellow.100"
            const colorMap = {
                longProp,
            };
            <ColorBox color={colorMap[wrapperMap.thirdRef + wrapperMap["fourthRef"]]}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "yellow.100"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "Identifier",
                              "BinaryExpression",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "ObjectLiteralExpression",
                              "Identifier",
                              "VariableDeclaration",
                              "ShorthandPropertyAssignment",
                              "Identifier",
                              "VariableDeclaration",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "yellow.100",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ConditionalExpression evaluate (first when true is right)', () => {
  expect(
    extractFromCode(`
            const isShown = true;
            const dynamicColorName = "something";
            const nestedReference = { ref: dynamicColorName } as const;
            const deepReference = nestedReference.ref;

            const colorMap = {
                literalColor: "yellow.200",
                [deepReference]: "yellow.300",
                refToAnother: "another",
                another: "yellow.400",
            };

            <ColorBox color={colorMap[isShown ? ("literalColor" as const) : (false ? "yellow.never" : 1 === 1 ? colorMap["refToAnother"] : deepReference)] as any}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "yellow.200"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "Identifier",
                              "ConditionalExpression",
                              "Identifier",
                              "VariableDeclaration",
                              "PropertyAssignment",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "yellow.200",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ConditionalExpression evaluate (second when true is right)', () => {
  expect(
    extractFromCode(`
            const dynamicColorName = "something";
            const nestedReference = { ref: dynamicColorName } as const;
            const deepReference = nestedReference.ref;

            const colorMap = {
                literalColor: "yellow.200",
                [deepReference]: "yellow.300",
                refToAnother: "another",
                another: "yellow.500",
            };

            <ColorBox color={colorMap[(false ? "yellow.never" : 1 === 1 ? colorMap["refToAnother"] : deepReference)] as any}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "yellow.500"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "Identifier",
                              "ConditionalExpression",
                              "Identifier",
                              "VariableDeclaration",
                              "PropertyAssignment",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "yellow.500",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > CallExpression > ArrowFunction > Identifier (StringLiteral)', () => {
  expect(
    extractFromCode(`
            const getColor = () => "yellow.600";

            <ColorBox color={getColor()}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "yellow.600"]],
              {
                  color: [
                      {
                          stack: ["JsxAttribute", "JsxExpression", "CallExpression"],
                          type: "literal",
                          node: "CallExpression",
                          value: "yellow.600",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > CallExpression > FunctionDeclaration > Identifier (StringLiteral)', () => {
  expect(
    extractFromCode(`
            function getColor() {
                return "yellow.700";
            }

            <ColorBox color={getColor()}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "yellow.700"]],
              {
                  color: [
                      {
                          stack: ["JsxAttribute", "JsxExpression", "CallExpression"],
                          type: "literal",
                          node: "CallExpression",
                          value: "yellow.700",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > CallExpression with Parameter > ElementAccessExpression > ArrayLiteralExpression > StringLiteral', () => {
  expect(
    extractFromCode(`
            const pickSecondElement = (arr: string[]) => arr[1];
            const array = ["yellow.800", "yellow.900"];

            <ColorBox color={pickSecondElement(array)}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "yellow.900"]],
              {
                  color: [
                      {
                          stack: ["JsxAttribute", "JsxExpression", "CallExpression"],
                          type: "literal",
                          node: "CallExpression",
                          value: "yellow.900",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > CallExpression with non-deterministic results > should return nothing', () => {
  expect(
    extractFromCode(`
            const pickRandom = <T = any>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
            const array = ["purple.never1", "purple.alsoNever"];

            <ColorBox color={pickRandom(array)}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", null]],
              {
                  color: [
                      {
                          stack: ["JsxAttribute", "JsxExpression", "CallExpression"],
                          type: "unresolvable",
                          node: "CallExpression",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ConditionalExpression > BinaryExpression > StringLiteral', () => {
  expect(
    extractFromCode(`
            <ColorBox color={(1 + 1) === 2 ? "purple.100" : "purple.never2"}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "purple.100"]],
              {
                  color: [
                      {
                          stack: ["JsxAttribute", "JsxExpression", "ConditionalExpression"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "purple.100",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ElementAccessExpression > ConditionalExpression > ParenthesizedExpression > BinaryExpression', () => {
  expect(
    extractFromCode(`
            const colorMap = {
                literalColor: "purple.200",
            };
            <ColorBox color={colorMap[(1 + 1) !== 2 ? "never" : "literalColor"]}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "purple.200"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "Identifier",
                              "ConditionalExpression",
                              "Identifier",
                              "VariableDeclaration",
                              "PropertyAssignment",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "purple.200",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > CallExpression > ElementAccessExpression > ArrowFunction > ElementAccessExpression > ArrayLiteralExpression > Identifier > CallExpression > ConditionalExpression > BinaryExpression', () => {
  expect(
    extractFromCode(`
            const array = ["never1", "literalColor"]
            const getter = () => array[1];
            const colorMap = {
                literalColor: () => (1 + 1) === 3 ? "never2" : "purple.300",
            };
            <ColorBox color={colorMap[getter()]()}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "purple.300"]],
              {
                  color: [
                      {
                          stack: ["JsxAttribute", "JsxExpression", "CallExpression"],
                          type: "literal",
                          node: "CallExpression",
                          value: "purple.300",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > BinaryExpression > StringLiteral', () => {
  expect(
    extractFromCode(`
            const dot = ".";
            <ColorBox color={"purple" + dot + "400"}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "purple.400"]],
              {
                  color: [
                      {
                          stack: ["JsxAttribute", "JsxExpression", "BinaryExpression", "Identifier", "VariableDeclaration"],
                          type: "literal",
                          node: "BinaryExpression",
                          value: "purple.400",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > resolvable ConditionalExpression result', () => {
  expect(
    extractFromCode(`
            const isShown = true;
            const dynamicColorName = "something";
            const dynamicElement = "staticColor";
            const staticColor = "never.100" as const;

            const colorMap = {
                staticColor,
                [dynamicColorName]: "purple.500",
            };
            const dynamicColor = colorMap[dynamicElement];

            <ColorBox color={(isShown ? colorMap?.[dynamicColorName] : dynamicColor) as any}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "purple.500"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ConditionalExpression",
                              "Identifier",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "Identifier",
                              "VariableDeclaration",
                              "PropertyAssignment",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "purple.500",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it("extract JsxAttribute > JsxExpression > ConditionalExpression with Unexpected Node: 'BindingElement' cause of useState should fallback to both possible outcome", () => {
  expect(
    extractFromCode(`
            const [isShown] = useState(true);
            const dynamicColorName = "something";
            const dynamicElement = "staticColor";
            const staticColor = "purple.700" as const;

            const colorMap = {
                staticColor,
                [dynamicColorName]: "purple.600",
            };
            const dynamicColor = colorMap[dynamicElement];

            <ColorBox color={(isShown ? colorMap?.[dynamicColorName] : dynamicColor) as any}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", ["purple.600", "purple.700"]]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ConditionalExpression",
                              "Identifier",
                              "VariableDeclaration",
                          ],
                          type: "conditional",
                          node: "ConditionalExpression",
                          whenTrue: {
                              stack: [
                                  "JsxAttribute",
                                  "JsxExpression",
                                  "ConditionalExpression",
                                  "Identifier",
                                  "Identifier",
                                  "Identifier",
                                  "VariableDeclaration",
                                  "Identifier",
                                  "VariableDeclaration",
                                  "PropertyAssignment",
                              ],
                              type: "literal",
                              node: "StringLiteral",
                              value: "purple.600",
                              kind: "string",
                          },
                          whenFalse: {
                              stack: [
                                  "JsxAttribute",
                                  "JsxExpression",
                                  "ConditionalExpression",
                                  "Identifier",
                                  "VariableDeclaration",
                                  "ElementAccessExpression",
                                  "Identifier",
                                  "Identifier",
                                  "Identifier",
                                  "VariableDeclaration",
                                  "Identifier",
                                  "VariableDeclaration",
                                  "ShorthandPropertyAssignment",
                                  "Identifier",
                                  "VariableDeclaration",
                                  "StringLiteral",
                              ],
                              type: "literal",
                              node: "StringLiteral",
                              value: "purple.700",
                              kind: "string",
                          },
                          kind: "ternary",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ConditionalExpression > unresolvable expression will output both outcome ', () => {
  expect(
    extractFromCode(`
            const [unresolvableBoolean, setUnresolvableBoolean] = useState(false)
            const knownCondition = true;

            <ColorBox color={(!knownCondition ? "purple.800" : unresolvableBoolean ? "purple.900" : "purple.950")}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", ["purple.900", "purple.950"]]],
              {
                  color: [
                      {
                          stack: ["JsxAttribute", "JsxExpression", "ConditionalExpression"],
                          type: "conditional",
                          node: "ConditionalExpression",
                          whenTrue: {
                              stack: ["JsxAttribute", "JsxExpression", "ConditionalExpression"],
                              type: "literal",
                              node: "StringLiteral",
                              value: "purple.900",
                              kind: "string",
                          },
                          whenFalse: {
                              stack: ["JsxAttribute", "JsxExpression", "ConditionalExpression"],
                              type: "literal",
                              node: "StringLiteral",
                              value: "purple.950",
                              kind: "string",
                          },
                          kind: "ternary",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ConditionalExpression > ElementAccessExpression > nested unresolvable expression will output both outcome ', () => {
  expect(
    extractFromCode(`
            const [unresolvableBoolean, setUnresolvableBoolean] = useState(false)
            const knownCondition = true;

            const colorMap = {
                staticColor: "orange.200",
                another: "orange.300",
            };

            <ColorBox color={(!knownCondition ? "orange.100" : colorMap[unresolvableBoolean ? "staticColor" : "another"])}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", ["orange.200", "orange.300"]]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ConditionalExpression",
                              "Identifier",
                              "ConditionalExpression",
                              "Identifier",
                              "VariableDeclaration",
                              "ObjectLiteralExpression",
                              "Identifier",
                              "VariableDeclaration",
                              "ObjectLiteralExpression",
                          ],
                          type: "conditional",
                          node: "ConditionalExpression",
                          whenTrue: {
                              stack: [
                                  "JsxAttribute",
                                  "JsxExpression",
                                  "ConditionalExpression",
                                  "Identifier",
                                  "ConditionalExpression",
                                  "Identifier",
                                  "VariableDeclaration",
                                  "PropertyAssignment",
                              ],
                              type: "literal",
                              node: "StringLiteral",
                              value: "orange.200",
                              kind: "string",
                          },
                          whenFalse: {
                              stack: [
                                  "JsxAttribute",
                                  "JsxExpression",
                                  "ConditionalExpression",
                                  "Identifier",
                                  "ConditionalExpression",
                                  "Identifier",
                                  "VariableDeclaration",
                                  "ObjectLiteralExpression",
                                  "Identifier",
                                  "VariableDeclaration",
                                  "PropertyAssignment",
                              ],
                              type: "literal",
                              node: "StringLiteral",
                              value: "orange.300",
                              kind: "string",
                          },
                          kind: "ternary",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ConditionalExpression > ElementAccessExpression > with nested unresolvable expression will stop at first resolved truthy condition', () => {
  expect(
    extractFromCode(`
            const [unresolvableBoolean, setUnresolvableBoolean] = useState(false)
            const knownTruthy = true;

            const colorMap = {
                staticColor: "never.200",
                another: "never.300",
            };

            <ColorBox color={(knownTruthy ? "orange.400" : colorMap[unresolvableBoolean ? "staticColor" : "another"])}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "orange.400"]],
              {
                  color: [
                      {
                          stack: ["JsxAttribute", "JsxExpression", "ConditionalExpression"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "orange.400",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > multiple variables with same name but different scope', () => {
  expect(
    extractFromCode(`
            const color = "never.500";

            const Wrapper = () => {
                const color = "orange.500";
                return <ColorBox color={color}></ColorBox>
            }

        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "orange.500"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "orange.500",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > variables referencing another var in above scope', () => {
  expect(
    extractFromCode(`
            const referenced = "orange.600";

            const Wrapper = () => {
                const color = referenced;
                return <ColorBox color={color}></ColorBox>
            }

        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "orange.600"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "orange.600",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxSpreadAttribute > ObjectLiteralExpression', () => {
  expect(
    extractFromCode(`
            <ColorBox {...{ color: "orange.700" }}>spread</ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "orange.700"]],
              {
                  color: [
                      {
                          stack: ["PropertyAssignment", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "orange.700",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxSpreadAttribute > ObjectLiteralExpression with allowed properties list', () => {
  expect(
    extractFromCode(`
            <ColorBox {...{ color: "orange.725", flexDirection: "flex", ...{ backgroundColor: "orange.750", justifyContent: "center" } }}>spread</ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  ["color", "orange.725"],
                  ["backgroundColor", "orange.750"],
              ],
              {
                  color: [
                      {
                          stack: ["PropertyAssignment", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "orange.725",
                          kind: "string",
                      },
                  ],
                  backgroundColor: [
                      {
                          stack: ["SpreadAssignment", "ObjectLiteralExpression", "PropertyAssignment", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "orange.750",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxSpreadAttribute > Identifier > ObjectLiteralExpression', () => {
  expect(
    extractFromCode(`
            const objectWithAttributes = { color: "orange.800" } as any;
            <ColorBox {...objectWithAttributes}>var spread</ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "orange.800"]],
              {
                  color: [
                      {
                          stack: [
                              "Identifier",
                              "VariableDeclaration",
                              "ObjectLiteralExpression",
                              "PropertyAssignment",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "orange.800",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

// TODO same with ts-evaluator if flag is enabled
it('extract JsxSpreadAttribute > ConditionalExpression > Identifier/NullKeyword > falsy', () => {
  expect(
    extractFromCode(`
            const isShown = false;
            const objectWithAttributes = { color: "never.400" } as any;
            <ColorBox {...(isShown ? objectWithAttributes : null)}>conditional var spread</ColorBox>
        `),
  ).toMatchInlineSnapshot('[["ColorBox", [], {}]]')
})

it('extract JsxSpreadAttribute > ConditionalExpression > Identifier/NullKeyword > truthy', () => {
  expect(
    extractFromCode(`
            const isShown = true;
            const objectWithAttributes = { color: "orange.900" } as any;
            <ColorBox {...(isShown ? objectWithAttributes : null)}>conditional var spread</ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "orange.900"]],
              {
                  color: [
                      {
                          stack: [
                              "Identifier",
                              "VariableDeclaration",
                              "ObjectLiteralExpression",
                              "PropertyAssignment",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "orange.900",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxSpreadAttribute > PropertyAssignment / ComputedProperty', () => {
  expect(
    extractFromCode(`
            const dynamicThemeProp = "backgroundColor";
            const dynamicAttribute = "notThemeProp";
            <ColorBox
                {...{
                    color: "teal.100",
                    [dynamicThemeProp]: "teal.200",
                    [dynamicAttribute]: "teal.300",
                }}
            >
                multiple spread
            </ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  ["color", "teal.100"],
                  ["backgroundColor", "teal.200"],
              ],
              {
                  color: [
                      {
                          stack: ["PropertyAssignment", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "teal.100",
                          kind: "string",
                      },
                  ],
                  backgroundColor: [
                      {
                          stack: ["PropertyAssignment", "Identifier", "Identifier", "VariableDeclaration", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "teal.200",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxSpreadAttribute > ConditionalExpression > ObjectLiteralExpression/Identifier', () => {
  expect(
    extractFromCode(`
            <ColorBox {...(true ? ({ color: "teal.400" }) as any : (undefined) as unknown)}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "teal.400"]],
              {
                  color: [
                      {
                          stack: ["PropertyAssignment", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "teal.400",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxSpreadAttribute > BinaryExpression > AmpersandAmpersandToken / ObjectLiteralExpression', () => {
  expect(
    extractFromCode(`
            <ColorBox {...(true && ({ color: "teal.500" }))}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "teal.500"]],
              {
                  color: [
                      {
                          stack: ["PropertyAssignment", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "teal.500",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxSpreadAttribute > CallExpression', () => {
  expect(
    extractFromCode(`
            const getColorConfig = () => ({ color: "teal.600", backgroundColor: "teal.650" });
            <ColorBox {...getColorConfig()}>spread fn result</ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  ["color", "teal.600"],
                  ["backgroundColor", "teal.650"],
              ],
              {
                  color: [
                      {
                          stack: [],
                          type: "literal",
                          node: "CallExpression",
                          value: "teal.600",
                          kind: "string",
                      },
                  ],
                  backgroundColor: [
                      {
                          stack: [],
                          type: "literal",
                          node: "CallExpression",
                          value: "teal.650",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxSpreadAttribute > CallExpression with allowed properties list', () => {
  expect(
    extractFromCode(`
            const getColorConfig = () => ({ color: "teal.625", backgroundColor: "teal.675", flexDirection: "flex", ...{ backgroundColor: "teal.699", justifyContent: "center" } });
            <ColorBox {...getColorConfig()}>spread fn result</ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  ["color", "teal.625"],
                  ["backgroundColor", "teal.699"],
              ],
              {
                  color: [
                      {
                          stack: [],
                          type: "literal",
                          node: "CallExpression",
                          value: "teal.625",
                          kind: "string",
                      },
                  ],
                  backgroundColor: [
                      {
                          stack: [],
                          type: "literal",
                          node: "CallExpression",
                          value: "teal.699",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxSpreadAttribute > ObjectLiteralExpression > SpreadAssignment > CallExpression', () => {
  expect(
    extractFromCode(`
            const getColorConfig = () => ({ color: "never.700", backgroundColor: "teal.800" });
            <ColorBox {...{ ...getColorConfig(), color: "teal.700" }}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  ["backgroundColor", "teal.800"],
                  ["color", "teal.700"],
              ],
              {
                  backgroundColor: [
                      {
                          stack: ["SpreadAssignment", "CallExpression"],
                          type: "literal",
                          node: "CallExpression",
                          value: "teal.800",
                          kind: "string",
                      },
                  ],
                  color: [
                      {
                          stack: ["PropertyAssignment", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "teal.700",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxSpreadAttribute > ObjectLiteralExpression > SpreadAssignment > ConditionalExpression > CallExpression', () => {
  expect(
    extractFromCode(`
            const isShown = true;
            const getColorConfig = () => ({ color: "teal.900", backgroundColor: "cyan.100" });
            <ColorBox
                {...{
                    ...(isShown ? (getColorConfig() as any) : { color: "never.150" }),
                    color: "cyan.200",
                }}
            >
                nested spread conditional fn result and override
            </ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  ["backgroundColor", "cyan.100"],
                  ["color", "cyan.200"],
              ],
              {
                  backgroundColor: [
                      {
                          stack: ["SpreadAssignment", "ConditionalExpression"],
                          type: "literal",
                          node: "ConditionalExpression",
                          value: "cyan.100",
                          kind: "string",
                      },
                  ],
                  color: [
                      {
                          stack: ["PropertyAssignment", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "cyan.200",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxSpreadAttribute > BinaryExpression > AmpersandAmpersandToken / ObjectLiteralExpression', () => {
  expect(
    extractFromCode(`
            const isShown = true;
            const getColorConfig = () => ({ color: "never.300", backgroundColor: "never.400" });
            const dynamicAttribute = "background" + "Color";
            <ColorBox
                {...{
                    ...(!isShown ? (getColorConfig() as any) : ({ [dynamicAttribute]: "cyan.300" } as any)),
                    color: "cyan.400",
                }}
            >
                nested spread conditional fn result and override with object literal expression and dynamic
                attribute
            </ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  ["backgroundColor", "cyan.300"],
                  ["color", "cyan.400"],
              ],
              {
                  backgroundColor: [
                      {
                          stack: ["SpreadAssignment", "ConditionalExpression"],
                          type: "literal",
                          node: "ConditionalExpression",
                          value: "cyan.300",
                          kind: "string",
                      },
                  ],
                  color: [
                      {
                          stack: ["PropertyAssignment", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "cyan.400",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxSpreadAttribute > 3 depth spread', () => {
  expect(
    extractFromCode(`
            const getColorConfig = () => ({ color: "cyan.500", backgroundColor: "never.600" });
            <ColorBox
                {...{
                    ...{
                        ...getColorConfig(),
                        backgroundColor: "never.700",
                    },
                    backgroundColor: "cyan.600",
                }}
            >
                spread with nested spread with nested spread and override
            </ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  ["color", "cyan.500"],
                  ["backgroundColor", "cyan.600"],
              ],
              {
                  color: [
                      {
                          stack: ["SpreadAssignment", "ObjectLiteralExpression", "SpreadAssignment", "CallExpression"],
                          type: "literal",
                          node: "CallExpression",
                          value: "cyan.500",
                          kind: "string",
                      },
                  ],
                  backgroundColor: [
                      {
                          stack: ["PropertyAssignment", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "cyan.600",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it("extract JsxSpreadAttribute > ConditionalExpression > unresolvable expression with Unexpected Node: 'BindingElement' cause of useState should fallback to both possible outcome ", () => {
  expect(
    extractFromCode(`
            const [isShown] = useState(true);
            const objectWithAttributes = { color: "cyan.700" } as any;
            <ColorBox {...(isShown ? objectWithAttributes : { backgroundColor: "cyan.800" })}>conditional var spread</ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  ["color", "cyan.700"],
                  ["backgroundColor", "cyan.800"],
              ],
              {
                  color: [
                      {
                          stack: [
                              "Identifier",
                              "VariableDeclaration",
                              "ObjectLiteralExpression",
                              "PropertyAssignment",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "cyan.700",
                          kind: "string",
                      },
                  ],
                  backgroundColor: [
                      {
                          stack: ["Identifier", "VariableDeclaration", "PropertyAssignment", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "cyan.800",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxSpreadAttribute > ElementAccessExpression', () => {
  expect(
    extractFromCode(`
            const objectWithAttributes = { color: "cyan.900" } as any;
            const themeObjectsMap = {
                basic: objectWithAttributes,
            };
            <ColorBox {...themeObjectsMap[\`basic\`]}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "cyan.900"]],
              {
                  color: [
                      {
                          stack: [
                              "Identifier",
                              "NoSubstitutionTemplateLiteral",
                              "Identifier",
                              "VariableDeclaration",
                              "PropertyAssignment",
                              "Identifier",
                              "VariableDeclaration",
                              "ObjectLiteralExpression",
                              "PropertyAssignment",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "cyan.900",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxSpreadAttribute > PropertyAccessExpression', () => {
  expect(
    extractFromCode(`
            const objectWithAttributes = { color: "salmon.100" } as any;
            const themeObjectsMap = {
                basic: objectWithAttributes,
            };
            <ColorBox {...themeObjectsMap.basic}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "salmon.100"]],
              {
                  color: [
                      {
                          stack: [
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "PropertyAssignment",
                              "Identifier",
                              "VariableDeclaration",
                              "ObjectLiteralExpression",
                              "PropertyAssignment",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "salmon.100",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxSpreadAttribute > PropertyAccessExpression > nested', () => {
  expect(
    extractFromCode(`
            const objectWithAttributes = { color: "salmon.200" } as any;
            const themeObjectsMap = {
                basic: {
                    nested: objectWithAttributes
                },
            };
            <ColorBox {...themeObjectsMap.basic.nested}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "salmon.200"]],
              {
                  color: [
                      {
                          stack: [
                              "PropertyAccessExpression",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "PropertyAssignment",
                              "PropertyAssignment",
                              "Identifier",
                              "VariableDeclaration",
                              "ObjectLiteralExpression",
                              "PropertyAssignment",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "salmon.200",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxSpreadAttribute > ElementAccessExpression + PropertyAccessExpression', () => {
  expect(
    extractFromCode(`
            const objectWithAttributes = { color: "salmon.300" } as any;
            const themeObjectsMap = {
                basic: { nested: objectWithAttributes },
            };
            <ColorBox {...themeObjectsMap[\`basic\`].nested}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "salmon.300"]],
              {
                  color: [
                      {
                          stack: [
                              "ElementAccessExpression",
                              "Identifier",
                              "NoSubstitutionTemplateLiteral",
                              "Identifier",
                              "VariableDeclaration",
                              "PropertyAssignment",
                              "PropertyAssignment",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "ObjectLiteralExpression",
                              "PropertyAssignment",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "salmon.300",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxSpreadAttribute > ElementAccessExpression > nested', () => {
  expect(
    extractFromCode(`
            const objectWithAttributes = { color: "salmon.400" } as any;
            const themeObjectsMap = {
                basic: { nested: objectWithAttributes },
            };
            <ColorBox {...themeObjectsMap[\`basic\`]["nested"]}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "salmon.400"]],
              {
                  color: [
                      {
                          stack: [
                              "ElementAccessExpression",
                              "StringLiteral",
                              "Identifier",
                              "NoSubstitutionTemplateLiteral",
                              "Identifier",
                              "VariableDeclaration",
                              "PropertyAssignment",
                              "PropertyAssignment",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "ObjectLiteralExpression",
                              "PropertyAssignment",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "salmon.400",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxSpreadAttribute > ElementAccessExpression > Identifier / ComputedProperty', () => {
  expect(
    extractFromCode(`
            const objectWithAttributes = { color: "salmon.500" } as any;
            const dynamicAttribute = "basic";
            const themeObjectsMap = {
                [dynamicAttribute]: objectWithAttributes
            };
            <ColorBox {...themeObjectsMap[dynamicAttribute]}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "salmon.500"]],
              {
                  color: [
                      {
                          stack: [
                              "Identifier",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "Identifier",
                              "VariableDeclaration",
                              "PropertyAssignment",
                              "Identifier",
                              "VariableDeclaration",
                              "ObjectLiteralExpression",
                              "PropertyAssignment",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "salmon.500",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxSpreadAttribute > ElementAccessExpression > ComputedProperty / TemplateStringLiteral', () => {
  expect(
    extractFromCode(`
            const objectWithAttributes = { color: "salmon.600" } as any;
            const dynamicPart1 = "long";
            const dynamicPart2 = "Prop";
            const dynamicPartsAsTemplateString = \`\${dynamicPart1}\${dynamicPart2}\`;

            const themeObjectsMap = {
                longProp: objectWithAttributes
            };
            <ColorBox {...(themeObjectsMap[\`\${dynamicPartsAsTemplateString}\`]) as any}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "salmon.600"]],
              {
                  color: [
                      {
                          stack: [
                              "Identifier",
                              "TemplateExpression",
                              "Identifier",
                              "VariableDeclaration",
                              "Identifier",
                              "VariableDeclaration",
                              "PropertyAssignment",
                              "Identifier",
                              "VariableDeclaration",
                              "ObjectLiteralExpression",
                              "PropertyAssignment",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "salmon.600",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxSpreadAttribute > JsxExpression > ConditionalExpression > complex nested condition > truthy + truthy', () => {
  expect(
    extractFromCode(`
            const knownCondition = true;

            const objectWithAttributes = { color: "salmon.700" } as any;
            const dynamicPart1 = "long";
            const dynamicPart2 = "Prop";

            const themeObjectsMap = {
                basic: objectWithAttributes,
                ['long' + 'Prop']: { color: "never.500" },
            };
            const getBasic = () => (themeObjectsMap as any)?.basic!;
            const getMap = { getter: getBasic };
            const assertMap = { isTrue: () => !!Boolean(true) && 1 };

            <ColorBox {...(!knownCondition ? { color: "never.250" } : assertMap.isTrue() ? getMap.getter() : themeObjectsMap[dynamicPart1 + dynamicPart2] )}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "salmon.700"]],
              {
                  color: [
                      {
                          stack: [],
                          type: "literal",
                          node: "CallExpression",
                          value: "salmon.700",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxSpreadAttribute > JsxExpression > ConditionalExpression > complex nested condition > truthy + falsy', () => {
  expect(
    extractFromCode(`
            const knownCondition = true;

            const objectWithAttributes = { color: "never.700" } as any;
            const dynamicPart1 = "long";
            const dynamicPart2 = "Prop";

            const themeObjectsMap = {
                basic: objectWithAttributes,
                ['long' + 'Prop']: { color: "salmon.800" },
            };
            const getBasic = () => (themeObjectsMap as any)?.basic!;
            const getMap = { getter: getBasic };
            const assertMap = { isFalse: () => false };

            <ColorBox {...(!knownCondition ? { color: "never.250" } : assertMap.isFalse() ? getMap.getter() : themeObjectsMap[dynamicPart1 + dynamicPart2] )}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "salmon.800"]],
              {
                  color: [
                      {
                          stack: [
                              "Identifier",
                              "BinaryExpression",
                              "Identifier",
                              "VariableDeclaration",
                              "Identifier",
                              "VariableDeclaration",
                              "Identifier",
                              "VariableDeclaration",
                              "PropertyAssignment",
                              "PropertyAssignment",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "salmon.800",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxSpreadAttribute > JsxExpression > ConditionalExpression > unresolvable expression will output both outcome ', () => {
  expect(
    extractFromCode(`
            const [unresolvableBoolean, setUnresolvableBoolean] = useState(false)
            const knownCondition = true;

            const objectWithAttributes = { color: "salmon.850" } as any;

            const themeObjectsMap = {
                basic: objectWithAttributes,
                ['long' + 'Prop']: { color: "salmon.900" },
            };

            <ColorBox {...(!knownCondition ? { color: "never.250" } : unresolvableBoolean ? themeObjectsMap.basic : themeObjectsMap.longProp )}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", ["salmon.850", "salmon.900"]]],
              {
                  color: [
                      {
                          stack: [
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "PropertyAssignment",
                              "Identifier",
                              "VariableDeclaration",
                              "ObjectLiteralExpression",
                              "PropertyAssignment",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "salmon.850",
                          kind: "string",
                      },
                      {
                          stack: [
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "ObjectLiteralExpression",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "PropertyAssignment",
                              "PropertyAssignment",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "salmon.900",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxSpreadAttribute > ElementAccessExpression > CallExpression', () => {
  expect(
    extractFromCode(`
            const objectWithAttributes = { color: "white.100" } as any;
            const getDynamicAttribute = () => "basic";
            const themeObjectsMap = {
                basic: objectWithAttributes
            };
            <ColorBox {...themeObjectsMap[getDynamicAttribute()]}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "white.100"]],
              {
                  color: [
                      {
                          stack: [
                              "Identifier",
                              "CallExpression",
                              "Identifier",
                              "VariableDeclaration",
                              "PropertyAssignment",
                              "Identifier",
                              "VariableDeclaration",
                              "ObjectLiteralExpression",
                              "PropertyAssignment",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "white.100",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > ElementAccessExpression > CallExpression > PropertyAccessExpression', () => {
  expect(
    extractFromCode(`
            const objectWithAttributes = { color: "white.200" } as any;
            const getDynamicAttribute = () => "basic";
            const themeObjectsMap = {
                basic: objectWithAttributes
            };
            <ColorBox color={themeObjectsMap[getDynamicAttribute()].color}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "white.200"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "PropertyAccessExpression",
                              "ElementAccessExpression",
                              "Identifier",
                              "CallExpression",
                              "Identifier",
                              "VariableDeclaration",
                              "PropertyAssignment",
                              "Identifier",
                              "VariableDeclaration",
                              "ObjectLiteralExpression",
                              "PropertyAssignment",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "white.200",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression  > NumericLiteral', () => {
  expect(
    extractFromCode(`
            <ColorBox zIndex={1}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["zIndex", 1]],
              {
                  zIndex: [
                      {
                          stack: ["JsxAttribute", "JsxExpression", "NumericLiteral"],
                          type: "literal",
                          node: "NumericLiteral",
                          value: 1,
                          kind: "number",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > NumericLiteral > PrefixUnaryExpression', () => {
  expect(
    extractFromCode(
      `
            <ThreeBox zIndex={1} position={[
                -1.2466866852487384, 0.3325255778835592, -0.6517939595349769,
              ]} scale={+1.25} someProp={-2}></ThreeBox>
        `,
      { tagNameList: ['ThreeBox'] },
    ),
  ).toMatchInlineSnapshot(`
      [
          [
              "ThreeBox",
              [
                  ["zIndex", 1],
                  ["position", [-1.2466866852487384, 0.3325255778835592, -0.6517939595349769]],
                  ["scale", 1.25],
                  ["someProp", -2],
              ],
              {
                  zIndex: [
                      {
                          stack: ["JsxAttribute", "JsxExpression", "NumericLiteral"],
                          type: "literal",
                          node: "NumericLiteral",
                          value: 1,
                          kind: "number",
                      },
                  ],
                  position: [
                      {
                          stack: ["JsxAttribute", "JsxExpression", "ArrayLiteralExpression"],
                          type: "list",
                          node: "ArrayLiteralExpression",
                          value: [
                              {
                                  stack: ["JsxAttribute", "JsxExpression", "ArrayLiteralExpression"],
                                  type: "literal",
                                  node: "PrefixUnaryExpression",
                                  value: -1.2466866852487384,
                                  kind: "number",
                              },
                              {
                                  stack: ["JsxAttribute", "JsxExpression", "ArrayLiteralExpression"],
                                  type: "literal",
                                  node: "NumericLiteral",
                                  value: 0.3325255778835592,
                                  kind: "number",
                              },
                              {
                                  stack: ["JsxAttribute", "JsxExpression", "ArrayLiteralExpression"],
                                  type: "literal",
                                  node: "PrefixUnaryExpression",
                                  value: -0.6517939595349769,
                                  kind: "number",
                              },
                          ],
                      },
                  ],
                  scale: [
                      {
                          stack: ["JsxAttribute", "JsxExpression", "PrefixUnaryExpression"],
                          type: "literal",
                          node: "NumericLiteral",
                          value: 1.25,
                          kind: "number",
                      },
                  ],
                  someProp: [
                      {
                          stack: ["JsxAttribute", "JsxExpression", "PrefixUnaryExpression"],
                          type: "literal",
                          node: "PrefixUnaryExpression",
                          value: -2,
                          kind: "number",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > Identifier > NumericLiteral', () => {
  expect(
    extractFromCode(`
            const nbIndex = 2;
            <ColorBox zIndex={nbIndex}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["zIndex", 2]],
              {
                  zIndex: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "NumericLiteral",
                          ],
                          type: "literal",
                          node: "NumericLiteral",
                          value: 2,
                          kind: "number",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > Identifier > ConditionExpression > NumericLiteral', () => {
  expect(
    extractFromCode(`
            const nbIndex = 1;
            const isShown = true;
            <ColorBox zIndex={isShown ? 3 : 0}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["zIndex", 3]],
              {
                  zIndex: [
                      {
                          stack: ["JsxAttribute", "JsxExpression", "ConditionalExpression"],
                          type: "literal",
                          node: "NumericLiteral",
                          value: 3,
                          kind: "number",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > CallExpression > immediately invoked > NumericLiteral', () => {
  expect(
    extractFromCode(`
            <ColorBox zIndex={(() => 4)()}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["zIndex", 4]],
              {
                  zIndex: [
                      {
                          stack: ["JsxAttribute", "JsxExpression", "CallExpression"],
                          type: "literal",
                          node: "CallExpression",
                          value: 4,
                          kind: "number",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > CallExpression > optional + NonNullable + AsExpression > NumericLiteral', () => {
  expect(
    extractFromCode(`
            const getMap = { get: () => 5 };
            <ColorBox zIndex={(getMap?.get()!) as any}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["zIndex", 5]],
              {
                  zIndex: [
                      {
                          stack: ["JsxAttribute", "JsxExpression", "CallExpression"],
                          type: "literal",
                          node: "CallExpression",
                          value: 5,
                          kind: "number",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ElementAccessExpression > NumericLiteral', () => {
  expect(
    extractFromCode(`
            const map = { thing: 6 };
            <ColorBox zIndex={map["thing"]}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["zIndex", 6]],
              {
                  zIndex: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "Identifier",
                              "StringLiteral",
                              "Identifier",
                              "VariableDeclaration",
                              "PropertyAssignment",
                          ],
                          type: "literal",
                          node: "NumericLiteral",
                          value: 6,
                          kind: "number",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ObjectLiteralExpression > conditional sprinkles', () => {
  expect(
    extractFromCode(`
            <ColorBox color={{ mobile: "white.300", tablet: "white.400", desktop: "white.500" }}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  [
                      "color",
                      {
                          mobile: "white.300",
                          tablet: "white.400",
                          desktop: "white.500",
                      },
                  ],
              ],
              {
                  color: [
                      {
                          stack: ["JsxAttribute", "JsxExpression", "ObjectLiteralExpression"],
                          type: "map",
                          node: "ObjectLiteralExpression",
                          value: {
                              mobile: {
                                  stack: [
                                      "JsxAttribute",
                                      "JsxExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "StringLiteral",
                                  ],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "white.300",
                                  kind: "string",
                              },
                              tablet: {
                                  stack: [
                                      "JsxAttribute",
                                      "JsxExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "StringLiteral",
                                  ],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "white.400",
                                  kind: "string",
                              },
                              desktop: {
                                  stack: [
                                      "JsxAttribute",
                                      "JsxExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "StringLiteral",
                                  ],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "white.500",
                                  kind: "string",
                              },
                          },
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > PropertyAccessExpression > ObjectLiteralExpression', () => {
  expect(
    extractFromCode(`
            const map = {
                responsiveColor: {
                    mobile: "white.600",
                    tablet: "white.700",
                    desktop: "white.800",
                }
            };

            <ColorBox color={(map?.responsiveColor) as any}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  [
                      "color",
                      {
                          mobile: "white.600",
                          tablet: "white.700",
                          desktop: "white.800",
                      },
                  ],
              ],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "PropertyAccessExpression",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "PropertyAssignment",
                          ],
                          type: "map",
                          node: "ObjectLiteralExpression",
                          value: {
                              mobile: {
                                  stack: [
                                      "JsxAttribute",
                                      "JsxExpression",
                                      "PropertyAccessExpression",
                                      "Identifier",
                                      "Identifier",
                                      "VariableDeclaration",
                                      "PropertyAssignment",
                                      "PropertyAssignment",
                                      "StringLiteral",
                                  ],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "white.600",
                                  kind: "string",
                              },
                              tablet: {
                                  stack: [
                                      "JsxAttribute",
                                      "JsxExpression",
                                      "PropertyAccessExpression",
                                      "Identifier",
                                      "Identifier",
                                      "VariableDeclaration",
                                      "PropertyAssignment",
                                      "PropertyAssignment",
                                      "StringLiteral",
                                  ],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "white.700",
                                  kind: "string",
                              },
                              desktop: {
                                  stack: [
                                      "JsxAttribute",
                                      "JsxExpression",
                                      "PropertyAccessExpression",
                                      "Identifier",
                                      "Identifier",
                                      "VariableDeclaration",
                                      "PropertyAssignment",
                                      "PropertyAssignment",
                                      "StringLiteral",
                                  ],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "white.800",
                                  kind: "string",
                              },
                          },
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > PropertyAccessExpression > CallExpression > ObjectLiteralExpression', () => {
  expect(
    extractFromCode(`
            const map = {
                responsiveColor: () => ({
                    mobile: "white.600",
                    tablet: "white.700",
                    desktop: "white.800",
                })
            };

            <ColorBox color={map["responsiveColor"]!()}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  [
                      "color",
                      {
                          mobile: "white.600",
                          tablet: "white.700",
                          desktop: "white.800",
                      },
                  ],
              ],
              {
                  color: [
                      {
                          stack: ["JsxAttribute", "JsxExpression", "CallExpression"],
                          type: "object",
                          node: "CallExpression",
                          value: {
                              mobile: "white.600",
                              tablet: "white.700",
                              desktop: "white.800",
                          },
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ElementAccessExpression + AsExpression + QuestionMarkToken + TemplateExpression + BinaryExpression + CallExpression', () => {
  expect(
    extractFromCode(`
            const colorRef = "Color";
            const dynamic = "responsiveColor";
            const responsiveColor = ({
                mobile: "black.100",
                tablet: "black.200",
                desktop: "black.300",
            });

            const map = {
                [dynamic]: () => responsiveColor
            };

            <ColorBox color={((map as any)?.[\`responsive\` + \`\${colorRef}\`] as any)()}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  [
                      "color",
                      {
                          mobile: "black.100",
                          tablet: "black.200",
                          desktop: "black.300",
                      },
                  ],
              ],
              {
                  color: [
                      {
                          stack: ["JsxAttribute", "JsxExpression", "CallExpression"],
                          type: "object",
                          node: "CallExpression",
                          value: {
                              mobile: "black.100",
                              tablet: "black.200",
                              desktop: "black.300",
                          },
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ConditionalExpression > StringLiteral/ObjectLiteralExpression (conditional sprinkles) > truthy', () => {
  expect(
    extractFromCode(`
            <ColorBox color={true ? { mobile: "black.400", tablet: "black.500", desktop: "black.600" } : "black.700"}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  [
                      "color",
                      {
                          mobile: "black.400",
                          tablet: "black.500",
                          desktop: "black.600",
                      },
                  ],
              ],
              {
                  color: [
                      {
                          stack: ["JsxAttribute", "JsxExpression", "ConditionalExpression"],
                          type: "map",
                          node: "ObjectLiteralExpression",
                          value: {
                              mobile: {
                                  stack: [
                                      "JsxAttribute",
                                      "JsxExpression",
                                      "ConditionalExpression",
                                      "PropertyAssignment",
                                      "StringLiteral",
                                  ],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "black.400",
                                  kind: "string",
                              },
                              tablet: {
                                  stack: [
                                      "JsxAttribute",
                                      "JsxExpression",
                                      "ConditionalExpression",
                                      "PropertyAssignment",
                                      "StringLiteral",
                                  ],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "black.500",
                                  kind: "string",
                              },
                              desktop: {
                                  stack: [
                                      "JsxAttribute",
                                      "JsxExpression",
                                      "ConditionalExpression",
                                      "PropertyAssignment",
                                      "StringLiteral",
                                  ],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "black.600",
                                  kind: "string",
                              },
                          },
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ConditionalExpression > StringLiteral/ObjectLiteralExpression (conditional sprinkles) > falsy', () => {
  expect(
    extractFromCode(`
            <ColorBox color={false ? { mobile: "black.400", tablet: "black.500", desktop: "black.600" } : "black.700"}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "black.700"]],
              {
                  color: [
                      {
                          stack: ["JsxAttribute", "JsxExpression", "ConditionalExpression"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "black.700",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ConditionalExpression > StringLiteral/ObjectLiteralExpression (conditional sprinkles) > unresolvable condition', () => {
  expect(
    extractFromCode(`
            const [isShown] = useState(true);
            <ColorBox color={isShown ? { mobile: "black.400", tablet: "black.500", desktop: "black.600" } : "black.700"}></ColorBox>
        `),
  ).toMatchInlineSnapshot(
    `
      [
          [
              "ColorBox",
              [
                  [
                      "color",
                      [
                          {
                              mobile: "black.400",
                              tablet: "black.500",
                              desktop: "black.600",
                          },
                          "black.700",
                      ],
                  ],
              ],
              {
                  color: [
                      {
                          stack: ["JsxAttribute", "JsxExpression", "ConditionalExpression"],
                          type: "conditional",
                          node: "ConditionalExpression",
                          whenTrue: {
                              stack: ["JsxAttribute", "JsxExpression", "ConditionalExpression"],
                              type: "map",
                              node: "ObjectLiteralExpression",
                              value: {
                                  mobile: {
                                      stack: [
                                          "JsxAttribute",
                                          "JsxExpression",
                                          "ConditionalExpression",
                                          "PropertyAssignment",
                                          "StringLiteral",
                                      ],
                                      type: "literal",
                                      node: "StringLiteral",
                                      value: "black.400",
                                      kind: "string",
                                  },
                                  tablet: {
                                      stack: [
                                          "JsxAttribute",
                                          "JsxExpression",
                                          "ConditionalExpression",
                                          "PropertyAssignment",
                                          "StringLiteral",
                                      ],
                                      type: "literal",
                                      node: "StringLiteral",
                                      value: "black.500",
                                      kind: "string",
                                  },
                                  desktop: {
                                      stack: [
                                          "JsxAttribute",
                                          "JsxExpression",
                                          "ConditionalExpression",
                                          "PropertyAssignment",
                                          "StringLiteral",
                                      ],
                                      type: "literal",
                                      node: "StringLiteral",
                                      value: "black.600",
                                      kind: "string",
                                  },
                              },
                          },
                          whenFalse: {
                              stack: ["JsxAttribute", "JsxExpression", "ConditionalExpression"],
                              type: "literal",
                              node: "StringLiteral",
                              value: "black.700",
                              kind: "string",
                          },
                          kind: "ternary",
                      },
                  ],
              },
          ],
      ]
    `,
  )
})

it('extract JsxAttribute > JsxExpression > reversed', () => {
  expect(
    extractFromCode(`
            <ColorBox mobile={{ color: "sky.100", tablet: "sky.200", desktop: "sky.300" }} />
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  [
                      "mobile",
                      {
                          color: "sky.100",
                          tablet: "sky.200",
                          desktop: "sky.300",
                      },
                  ],
              ],
              {
                  mobile: [
                      {
                          stack: ["JsxAttribute", "JsxExpression", "ObjectLiteralExpression"],
                          type: "map",
                          node: "ObjectLiteralExpression",
                          value: {
                              color: {
                                  stack: [
                                      "JsxAttribute",
                                      "JsxExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "StringLiteral",
                                  ],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "sky.100",
                                  kind: "string",
                              },
                              tablet: {
                                  stack: [
                                      "JsxAttribute",
                                      "JsxExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "StringLiteral",
                                  ],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "sky.200",
                                  kind: "string",
                              },
                              desktop: {
                                  stack: [
                                      "JsxAttribute",
                                      "JsxExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "StringLiteral",
                                  ],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "sky.300",
                                  kind: "string",
                              },
                          },
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > ObjectLiteralExpression > css prop', () => {
  expect(
    extractFromCode(`
        <ColorBox
            css={{
                backgroundColor: "sky.500",
                __color: "##ff0",
                mobile: { fontSize: "2xl", display: true ? "flex" : "block" },
                zIndex: { desktop: "10" },
            }}
        >
            css prop
        </ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  [
                      "css",
                      {
                          backgroundColor: "sky.500",
                          __color: "##ff0",
                          mobile: {
                              fontSize: "2xl",
                              display: "flex",
                          },
                          zIndex: {
                              desktop: "10",
                          },
                      },
                  ],
              ],
              {
                  css: [
                      {
                          stack: ["JsxAttribute", "JsxExpression", "ObjectLiteralExpression"],
                          type: "map",
                          node: "ObjectLiteralExpression",
                          value: {
                              backgroundColor: {
                                  stack: [
                                      "JsxAttribute",
                                      "JsxExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "StringLiteral",
                                  ],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "sky.500",
                                  kind: "string",
                              },
                              __color: {
                                  stack: [
                                      "JsxAttribute",
                                      "JsxExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "StringLiteral",
                                  ],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "##ff0",
                                  kind: "string",
                              },
                              mobile: {
                                  stack: [
                                      "JsxAttribute",
                                      "JsxExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "ObjectLiteralExpression",
                                  ],
                                  type: "map",
                                  node: "ObjectLiteralExpression",
                                  value: {
                                      fontSize: {
                                          stack: [
                                              "JsxAttribute",
                                              "JsxExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "StringLiteral",
                                          ],
                                          type: "literal",
                                          node: "StringLiteral",
                                          value: "2xl",
                                          kind: "string",
                                      },
                                      display: {
                                          stack: [
                                              "JsxAttribute",
                                              "JsxExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ConditionalExpression",
                                          ],
                                          type: "literal",
                                          node: "StringLiteral",
                                          value: "flex",
                                          kind: "string",
                                      },
                                  },
                              },
                              zIndex: {
                                  stack: [
                                      "JsxAttribute",
                                      "JsxExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "ObjectLiteralExpression",
                                  ],
                                  type: "map",
                                  node: "ObjectLiteralExpression",
                                  value: {
                                      desktop: {
                                          stack: [
                                              "JsxAttribute",
                                              "JsxExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "StringLiteral",
                                          ],
                                          type: "literal",
                                          node: "StringLiteral",
                                          value: "10",
                                          kind: "string",
                                      },
                                  },
                              },
                          },
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > ObjectLiteralExpression > css prop > ConditionalExpression', () => {
  expect(
    extractFromCode(`
        const [isShown] = useState(true);
        <ColorBox
            css={true ? {
                backgroundColor: "sky.600",
                __color: "##ff0",
                mobile: { fontSize: "2xl", display: isShown ? "flex" : "block" },
                zIndex: { desktop: "10" },
            } : "sky.700"}
        >
            css prop
        </ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  [
                      "css",
                      {
                          backgroundColor: "sky.600",
                          __color: "##ff0",
                          mobile: {
                              fontSize: "2xl",
                              display: ["flex", "block"],
                          },
                          zIndex: {
                              desktop: "10",
                          },
                      },
                  ],
              ],
              {
                  css: [
                      {
                          stack: ["JsxAttribute", "JsxExpression", "ConditionalExpression"],
                          type: "map",
                          node: "ObjectLiteralExpression",
                          value: {
                              backgroundColor: {
                                  stack: [
                                      "JsxAttribute",
                                      "JsxExpression",
                                      "ConditionalExpression",
                                      "PropertyAssignment",
                                      "StringLiteral",
                                  ],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "sky.600",
                                  kind: "string",
                              },
                              __color: {
                                  stack: [
                                      "JsxAttribute",
                                      "JsxExpression",
                                      "ConditionalExpression",
                                      "PropertyAssignment",
                                      "StringLiteral",
                                  ],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "##ff0",
                                  kind: "string",
                              },
                              mobile: {
                                  stack: [
                                      "JsxAttribute",
                                      "JsxExpression",
                                      "ConditionalExpression",
                                      "PropertyAssignment",
                                      "ObjectLiteralExpression",
                                  ],
                                  type: "map",
                                  node: "ObjectLiteralExpression",
                                  value: {
                                      fontSize: {
                                          stack: [
                                              "JsxAttribute",
                                              "JsxExpression",
                                              "ConditionalExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "StringLiteral",
                                          ],
                                          type: "literal",
                                          node: "StringLiteral",
                                          value: "2xl",
                                          kind: "string",
                                      },
                                      display: {
                                          stack: [
                                              "JsxAttribute",
                                              "JsxExpression",
                                              "ConditionalExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ConditionalExpression",
                                          ],
                                          type: "conditional",
                                          node: "ConditionalExpression",
                                          whenTrue: {
                                              stack: [
                                                  "JsxAttribute",
                                                  "JsxExpression",
                                                  "ConditionalExpression",
                                                  "PropertyAssignment",
                                                  "ObjectLiteralExpression",
                                                  "PropertyAssignment",
                                                  "ConditionalExpression",
                                              ],
                                              type: "literal",
                                              node: "StringLiteral",
                                              value: "flex",
                                              kind: "string",
                                          },
                                          whenFalse: {
                                              stack: [
                                                  "JsxAttribute",
                                                  "JsxExpression",
                                                  "ConditionalExpression",
                                                  "PropertyAssignment",
                                                  "ObjectLiteralExpression",
                                                  "PropertyAssignment",
                                                  "ConditionalExpression",
                                              ],
                                              type: "literal",
                                              node: "StringLiteral",
                                              value: "block",
                                              kind: "string",
                                          },
                                          kind: "ternary",
                                      },
                                  },
                              },
                              zIndex: {
                                  stack: [
                                      "JsxAttribute",
                                      "JsxExpression",
                                      "ConditionalExpression",
                                      "PropertyAssignment",
                                      "ObjectLiteralExpression",
                                  ],
                                  type: "map",
                                  node: "ObjectLiteralExpression",
                                  value: {
                                      desktop: {
                                          stack: [
                                              "JsxAttribute",
                                              "JsxExpression",
                                              "ConditionalExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "StringLiteral",
                                          ],
                                          type: "literal",
                                          node: "StringLiteral",
                                          value: "10",
                                          kind: "string",
                                      },
                                  },
                              },
                          },
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > ObjectLiteralExpression > css prop > PropertyAssignment > ConditionalExpression', () => {
  expect(
    extractFromCode(`
        const [isShown] = useState(true);
        <ColorBox
            css={{
                backgroundColor: isShown ? "sky.800" : "sky.900",
                __color: "##ff0",
                mobile: isShown ? { fontSize: "2xl", display: true ? "flex" : "block" } : "crimson.900",
                zIndex: { desktop: "10" },
            }}
        >
            css prop
        </ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  [
                      "css",
                      {
                          backgroundColor: ["sky.800", "sky.900"],
                          __color: "##ff0",
                          mobile: [
                              {
                                  fontSize: "2xl",
                                  display: "flex",
                              },
                              "crimson.900",
                          ],
                          zIndex: {
                              desktop: "10",
                          },
                      },
                  ],
              ],
              {
                  css: [
                      {
                          stack: ["JsxAttribute", "JsxExpression", "ObjectLiteralExpression"],
                          type: "map",
                          node: "ObjectLiteralExpression",
                          value: {
                              backgroundColor: {
                                  stack: [
                                      "JsxAttribute",
                                      "JsxExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "ConditionalExpression",
                                  ],
                                  type: "conditional",
                                  node: "ConditionalExpression",
                                  whenTrue: {
                                      stack: [
                                          "JsxAttribute",
                                          "JsxExpression",
                                          "ObjectLiteralExpression",
                                          "PropertyAssignment",
                                          "ConditionalExpression",
                                      ],
                                      type: "literal",
                                      node: "StringLiteral",
                                      value: "sky.800",
                                      kind: "string",
                                  },
                                  whenFalse: {
                                      stack: [
                                          "JsxAttribute",
                                          "JsxExpression",
                                          "ObjectLiteralExpression",
                                          "PropertyAssignment",
                                          "ConditionalExpression",
                                      ],
                                      type: "literal",
                                      node: "StringLiteral",
                                      value: "sky.900",
                                      kind: "string",
                                  },
                                  kind: "ternary",
                              },
                              __color: {
                                  stack: [
                                      "JsxAttribute",
                                      "JsxExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "StringLiteral",
                                  ],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "##ff0",
                                  kind: "string",
                              },
                              mobile: {
                                  stack: [
                                      "JsxAttribute",
                                      "JsxExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "ConditionalExpression",
                                  ],
                                  type: "conditional",
                                  node: "ConditionalExpression",
                                  whenTrue: {
                                      stack: [
                                          "JsxAttribute",
                                          "JsxExpression",
                                          "ObjectLiteralExpression",
                                          "PropertyAssignment",
                                          "ConditionalExpression",
                                      ],
                                      type: "map",
                                      node: "ObjectLiteralExpression",
                                      value: {
                                          fontSize: {
                                              stack: [
                                                  "JsxAttribute",
                                                  "JsxExpression",
                                                  "ObjectLiteralExpression",
                                                  "PropertyAssignment",
                                                  "ConditionalExpression",
                                                  "PropertyAssignment",
                                                  "StringLiteral",
                                              ],
                                              type: "literal",
                                              node: "StringLiteral",
                                              value: "2xl",
                                              kind: "string",
                                          },
                                          display: {
                                              stack: [
                                                  "JsxAttribute",
                                                  "JsxExpression",
                                                  "ObjectLiteralExpression",
                                                  "PropertyAssignment",
                                                  "ConditionalExpression",
                                                  "PropertyAssignment",
                                                  "ConditionalExpression",
                                              ],
                                              type: "literal",
                                              node: "StringLiteral",
                                              value: "flex",
                                              kind: "string",
                                          },
                                      },
                                  },
                                  whenFalse: {
                                      stack: [
                                          "JsxAttribute",
                                          "JsxExpression",
                                          "ObjectLiteralExpression",
                                          "PropertyAssignment",
                                          "ConditionalExpression",
                                      ],
                                      type: "literal",
                                      node: "StringLiteral",
                                      value: "crimson.900",
                                      kind: "string",
                                  },
                                  kind: "ternary",
                              },
                              zIndex: {
                                  stack: [
                                      "JsxAttribute",
                                      "JsxExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "ObjectLiteralExpression",
                                  ],
                                  type: "map",
                                  node: "ObjectLiteralExpression",
                                  value: {
                                      desktop: {
                                          stack: [
                                              "JsxAttribute",
                                              "JsxExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "StringLiteral",
                                          ],
                                          type: "literal",
                                          node: "StringLiteral",
                                          value: "10",
                                          kind: "string",
                                      },
                                  },
                              },
                          },
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > Identifier > BinaryExpression > (PropertyAccessExpression + QuestionQuestionToken + StringLiteral)', () => {
  expect(
    extractFromCode(`
            const Demo = (props) => {
                const color = props.color ?? "apple.100";

                <ColorBox color={color}></ColorBox>
            }

        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", ["apple.100"]]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "BinaryExpression",
                              "Identifier",
                          ],
                          type: "conditional",
                          node: "BinaryExpression",
                          whenTrue: {
                              stack: [
                                  "JsxAttribute",
                                  "JsxExpression",
                                  "Identifier",
                                  "Identifier",
                                  "VariableDeclaration",
                                  "BinaryExpression",
                                  "Identifier",
                              ],
                              type: "unresolvable",
                              node: "Identifier",
                          },
                          whenFalse: {
                              stack: [
                                  "JsxAttribute",
                                  "JsxExpression",
                                  "Identifier",
                                  "Identifier",
                                  "VariableDeclaration",
                                  "BinaryExpression",
                                  "Identifier",
                              ],
                              type: "literal",
                              node: "StringLiteral",
                              value: "apple.100",
                              kind: "string",
                          },
                          kind: "nullish-coalescing",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > Identifier > BinaryExpression > (PropertyAccessExpression + AmpersandAmpersandToken + StringLiteral)', () => {
  expect(
    extractFromCode(`
            const color = props.color && "apple.200";

            <ColorBox color={color}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", ["apple.200"]]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "BinaryExpression",
                              "Identifier",
                          ],
                          type: "conditional",
                          node: "BinaryExpression",
                          whenTrue: {
                              stack: [
                                  "JsxAttribute",
                                  "JsxExpression",
                                  "Identifier",
                                  "Identifier",
                                  "VariableDeclaration",
                                  "BinaryExpression",
                                  "Identifier",
                              ],
                              type: "unresolvable",
                              node: "Identifier",
                          },
                          whenFalse: {
                              stack: [
                                  "JsxAttribute",
                                  "JsxExpression",
                                  "Identifier",
                                  "Identifier",
                                  "VariableDeclaration",
                                  "BinaryExpression",
                                  "Identifier",
                              ],
                              type: "literal",
                              node: "StringLiteral",
                              value: "apple.200",
                              kind: "string",
                          },
                          kind: "and",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > Identifier > BinaryExpression > (PropertyAccessExpression + BarBarToken + StringLiteral)', () => {
  expect(
    extractFromCode(`
            const color = props.color || "apple.300";

            <ColorBox color={color}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", ["apple.300"]]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "BinaryExpression",
                              "Identifier",
                          ],
                          type: "conditional",
                          node: "BinaryExpression",
                          whenTrue: {
                              stack: [
                                  "JsxAttribute",
                                  "JsxExpression",
                                  "Identifier",
                                  "Identifier",
                                  "VariableDeclaration",
                                  "BinaryExpression",
                                  "Identifier",
                              ],
                              type: "unresolvable",
                              node: "Identifier",
                          },
                          whenFalse: {
                              stack: [
                                  "JsxAttribute",
                                  "JsxExpression",
                                  "Identifier",
                                  "Identifier",
                                  "VariableDeclaration",
                                  "BinaryExpression",
                                  "Identifier",
                              ],
                              type: "literal",
                              node: "StringLiteral",
                              value: "apple.300",
                              kind: "string",
                          },
                          kind: "or",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > Identifier > ArrayLiteralExpression)', () => {
  expect(
    extractFromCode(`
            const color = ["apple.400", "apple.500"];

            <ColorBox color={color}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", ["apple.400", "apple.500"]]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "ArrayLiteralExpression",
                          ],
                          type: "list",
                          node: "ArrayLiteralExpression",
                          value: [
                              {
                                  stack: [
                                      "JsxAttribute",
                                      "JsxExpression",
                                      "Identifier",
                                      "Identifier",
                                      "VariableDeclaration",
                                      "ArrayLiteralExpression",
                                  ],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "apple.400",
                                  kind: "string",
                              },
                              {
                                  stack: [
                                      "JsxAttribute",
                                      "JsxExpression",
                                      "Identifier",
                                      "Identifier",
                                      "VariableDeclaration",
                                      "ArrayLiteralExpression",
                                  ],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "apple.500",
                                  kind: "string",
                              },
                          ],
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ElementAccessExpression > ObjectLiteralExpression > PropertyAssignment > StringLiteral', () => {
  expect(
    extractFromCode(`
            <ColorBox color={({
                "apple": "apple.600",
            })["apple"]}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "apple.600"]],
              {
                  color: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "ElementAccessExpression",
                              "ObjectLiteralExpression",
                              "StringLiteral",
                              "PropertyAssignment",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "apple.600",
                          kind: "string",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute + CallExpression > booleans', () => {
  expect(
    extractFromCode(
      `
            <Container className={someFn({ isFlex: false })} withBorder={true} />
        `,
      { tagNameList: ['Container'], functionNameList: ['someFn'] },
    ),
  ).toMatchInlineSnapshot(`
      [
          [
              "Container",
              [
                  ["className", null],
                  ["withBorder", true],
              ],
              {
                  className: [
                      {
                          stack: ["JsxAttribute", "JsxExpression", "CallExpression"],
                          type: "unresolvable",
                          node: "CallExpression",
                      },
                  ],
                  withBorder: [
                      {
                          stack: ["JsxAttribute", "JsxExpression", "TrueKeyword"],
                          type: "literal",
                          node: "TrueKeyword",
                          value: true,
                          kind: "boolean",
                      },
                  ],
              },
          ],
          [
              "someFn",
              [["isFlex", false]],
              {
                  isFlex: [
                      {
                          stack: ["CallExpression", "ObjectLiteralExpression", "PropertyAssignment", "FalseKeyword"],
                          type: "literal",
                          node: "FalseKeyword",
                          value: false,
                          kind: "boolean",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > ArrayLiteralExpression', () => {
  expect(
    extractFromCode(
      `
            <Container classNames={["color:main", "hover:secondary"]} config={{ state: ["hovered", "focused"] }} />
        `,
      { tagNameList: ['Container'] },
    ),
  ).toMatchInlineSnapshot(`
      [
          [
              "Container",
              [
                  ["classNames", ["color:main", "hover:secondary"]],
                  [
                      "config",
                      {
                          state: ["hovered", "focused"],
                      },
                  ],
              ],
              {
                  classNames: [
                      {
                          stack: ["JsxAttribute", "JsxExpression", "ArrayLiteralExpression"],
                          type: "list",
                          node: "ArrayLiteralExpression",
                          value: [
                              {
                                  stack: ["JsxAttribute", "JsxExpression", "ArrayLiteralExpression"],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "color:main",
                                  kind: "string",
                              },
                              {
                                  stack: ["JsxAttribute", "JsxExpression", "ArrayLiteralExpression"],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "hover:secondary",
                                  kind: "string",
                              },
                          ],
                      },
                  ],
                  config: [
                      {
                          stack: ["JsxAttribute", "JsxExpression", "ObjectLiteralExpression"],
                          type: "map",
                          node: "ObjectLiteralExpression",
                          value: {
                              state: {
                                  stack: [
                                      "JsxAttribute",
                                      "JsxExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "ArrayLiteralExpression",
                                  ],
                                  type: "list",
                                  node: "ArrayLiteralExpression",
                                  value: [
                                      {
                                          stack: [
                                              "JsxAttribute",
                                              "JsxExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ArrayLiteralExpression",
                                          ],
                                          type: "literal",
                                          node: "StringLiteral",
                                          value: "hovered",
                                          kind: "string",
                                      },
                                      {
                                          stack: [
                                              "JsxAttribute",
                                              "JsxExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ArrayLiteralExpression",
                                          ],
                                          type: "literal",
                                          node: "StringLiteral",
                                          value: "focused",
                                          kind: "string",
                                      },
                                  ],
                              },
                          },
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > Identifier without initializer', () => {
  expect(
    extractFromCode(
      `
            <Flex col />
        `,
      { tagNameList: ['Flex'] },
    ),
  ).toMatchInlineSnapshot(`
      [
          [
              "Flex",
              [["col", null]],
              {
                  col: [
                      {
                          stack: ["JsxAttribute", null],
                          type: "empty-initializer",
                          node: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract CallExpression > ObjectLiteralExpression > PropertyAssignment > ObjectLiteralExpression > PropertyAssignment > ArrayLiteralExpression > StringLiteral)', () => {
  expect(
    extractFromCode(
      `
            const props = defineProperties({
                properties: {
                    position: ["relative", "absolute"],
                    display: ["block", "inline-block", "flex", "inline-flex"],
                },
                shorthands: {
                    p: ["position"],
                    d: ["display"],
                },
            });
        `,
      { tagNameList: [], functionNameList: ['defineProperties'] },
    ),
  ).toMatchInlineSnapshot(`
      [
          [
              "defineProperties",
              [
                  [
                      "properties",
                      {
                          position: ["relative", "absolute"],
                          display: ["block", "inline-block", "flex", "inline-flex"],
                      },
                  ],
                  [
                      "shorthands",
                      {
                          p: ["position"],
                          d: ["display"],
                      },
                  ],
              ],
              {
                  properties: [
                      {
                          stack: [
                              "CallExpression",
                              "ObjectLiteralExpression",
                              "PropertyAssignment",
                              "ObjectLiteralExpression",
                          ],
                          type: "map",
                          node: "ObjectLiteralExpression",
                          value: {
                              position: {
                                  stack: [
                                      "CallExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "ArrayLiteralExpression",
                                  ],
                                  type: "list",
                                  node: "ArrayLiteralExpression",
                                  value: [
                                      {
                                          stack: [
                                              "CallExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ArrayLiteralExpression",
                                          ],
                                          type: "literal",
                                          node: "StringLiteral",
                                          value: "relative",
                                          kind: "string",
                                      },
                                      {
                                          stack: [
                                              "CallExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ArrayLiteralExpression",
                                          ],
                                          type: "literal",
                                          node: "StringLiteral",
                                          value: "absolute",
                                          kind: "string",
                                      },
                                  ],
                              },
                              display: {
                                  stack: [
                                      "CallExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "ArrayLiteralExpression",
                                  ],
                                  type: "list",
                                  node: "ArrayLiteralExpression",
                                  value: [
                                      {
                                          stack: [
                                              "CallExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ArrayLiteralExpression",
                                          ],
                                          type: "literal",
                                          node: "StringLiteral",
                                          value: "block",
                                          kind: "string",
                                      },
                                      {
                                          stack: [
                                              "CallExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ArrayLiteralExpression",
                                          ],
                                          type: "literal",
                                          node: "StringLiteral",
                                          value: "inline-block",
                                          kind: "string",
                                      },
                                      {
                                          stack: [
                                              "CallExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ArrayLiteralExpression",
                                          ],
                                          type: "literal",
                                          node: "StringLiteral",
                                          value: "flex",
                                          kind: "string",
                                      },
                                      {
                                          stack: [
                                              "CallExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ArrayLiteralExpression",
                                          ],
                                          type: "literal",
                                          node: "StringLiteral",
                                          value: "inline-flex",
                                          kind: "string",
                                      },
                                  ],
                              },
                          },
                      },
                  ],
                  shorthands: [
                      {
                          stack: [
                              "CallExpression",
                              "ObjectLiteralExpression",
                              "PropertyAssignment",
                              "ObjectLiteralExpression",
                          ],
                          type: "map",
                          node: "ObjectLiteralExpression",
                          value: {
                              p: {
                                  stack: [
                                      "CallExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "ArrayLiteralExpression",
                                  ],
                                  type: "list",
                                  node: "ArrayLiteralExpression",
                                  value: [
                                      {
                                          stack: [
                                              "CallExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ArrayLiteralExpression",
                                          ],
                                          type: "literal",
                                          node: "StringLiteral",
                                          value: "position",
                                          kind: "string",
                                      },
                                  ],
                              },
                              d: {
                                  stack: [
                                      "CallExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "ArrayLiteralExpression",
                                  ],
                                  type: "list",
                                  node: "ArrayLiteralExpression",
                                  value: [
                                      {
                                          stack: [
                                              "CallExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ArrayLiteralExpression",
                                          ],
                                          type: "literal",
                                          node: "StringLiteral",
                                          value: "display",
                                          kind: "string",
                                      },
                                  ],
                              },
                          },
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract real-world Stack example ', () => {
  expect(
    extractFromCode(
      `
        export const Stack = <TType extends React.ElementType = typeof defaultElement>(
            props: PolymorphicComponentProps<StackProps, TType>
        ) => {
            const { children, as, spacing, ...rest } = props;
            const stackItems = Children.toArray(children);
            const direction = props.flexDirection ?? "column";

            return (
                <Box display="flex" flexDirection={direction} {...rest}>
                    {stackItems.map((item, index) => (
                        <Box
                            key={index}
                            pr={direction === "row" ? (index !== stackItems.length - 1 ? spacing : undefined) : undefined}
                            pb={direction === "column" ? (index !== stackItems.length - 1 ? spacing : undefined) : undefined}
                        >
                            {item}
                        </Box>
                    ))}
                </Box>
            );
        };

        const Something = () => {
            return (
                <Stack
                    as="header"
                    flexWrap="wrap"
                    alignItems="flex-end"
                    justifyContent="flex-end"
                    paddingRight={2}
                    paddingBottom={2}
                    borderBottomWidth="1px"
                    borderBottomColor="gray.400"
                    className={css.header}
                    _tablet={{ justifyContent: "space-between" }}
                />
            );
        };
        `,
      { tagNameList: ['Box', 'Stack'] },
    ),
  ).toMatchInlineSnapshot(`
      [
          [
              "Box",
              [
                  ["display", "flex"],
                  ["flexDirection", ["column"]],
                  ["key", null],
                  ["pr", []],
                  ["pb", []],
              ],
              {
                  display: [
                      {
                          stack: ["JsxAttribute", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "flex",
                          kind: "string",
                      },
                  ],
                  flexDirection: [
                      {
                          stack: [
                              "JsxAttribute",
                              "JsxExpression",
                              "Identifier",
                              "Identifier",
                              "VariableDeclaration",
                              "BinaryExpression",
                              "Identifier",
                          ],
                          type: "conditional",
                          node: "BinaryExpression",
                          whenTrue: {
                              stack: [
                                  "JsxAttribute",
                                  "JsxExpression",
                                  "Identifier",
                                  "Identifier",
                                  "VariableDeclaration",
                                  "BinaryExpression",
                                  "Identifier",
                              ],
                              type: "unresolvable",
                              node: "Identifier",
                          },
                          whenFalse: {
                              stack: [
                                  "JsxAttribute",
                                  "JsxExpression",
                                  "Identifier",
                                  "Identifier",
                                  "VariableDeclaration",
                                  "BinaryExpression",
                                  "Identifier",
                              ],
                              type: "literal",
                              node: "StringLiteral",
                              value: "column",
                              kind: "string",
                          },
                          kind: "nullish-coalescing",
                      },
                  ],
                  key: [
                      {
                          stack: ["JsxAttribute", "JsxExpression", "Identifier"],
                          type: "unresolvable",
                          node: "Identifier",
                      },
                  ],
                  pr: [
                      {
                          stack: ["JsxAttribute", "JsxExpression", "ConditionalExpression", "Identifier", "BindingElement"],
                          type: "conditional",
                          node: "ConditionalExpression",
                          whenTrue: {
                              stack: [
                                  "JsxAttribute",
                                  "JsxExpression",
                                  "ConditionalExpression",
                                  "Identifier",
                                  "BindingElement",
                              ],
                              type: "conditional",
                              node: "ConditionalExpression",
                              whenTrue: {
                                  stack: [
                                      "JsxAttribute",
                                      "JsxExpression",
                                      "ConditionalExpression",
                                      "Identifier",
                                      "BindingElement",
                                  ],
                                  type: "unresolvable",
                                  node: "BindingElement",
                              },
                              whenFalse: {
                                  stack: [
                                      "JsxAttribute",
                                      "JsxExpression",
                                      "ConditionalExpression",
                                      "Identifier",
                                      "BindingElement",
                                  ],
                                  type: "literal",
                                  node: "Identifier",
                                  kind: "undefined",
                              },
                              kind: "ternary",
                          },
                          whenFalse: {
                              stack: ["JsxAttribute", "JsxExpression", "ConditionalExpression"],
                              type: "literal",
                              node: "Identifier",
                              kind: "undefined",
                          },
                          kind: "ternary",
                      },
                  ],
                  pb: [
                      {
                          stack: ["JsxAttribute", "JsxExpression", "ConditionalExpression", "Identifier", "BindingElement"],
                          type: "conditional",
                          node: "ConditionalExpression",
                          whenTrue: {
                              stack: [
                                  "JsxAttribute",
                                  "JsxExpression",
                                  "ConditionalExpression",
                                  "Identifier",
                                  "BindingElement",
                              ],
                              type: "conditional",
                              node: "ConditionalExpression",
                              whenTrue: {
                                  stack: [
                                      "JsxAttribute",
                                      "JsxExpression",
                                      "ConditionalExpression",
                                      "Identifier",
                                      "BindingElement",
                                  ],
                                  type: "unresolvable",
                                  node: "BindingElement",
                              },
                              whenFalse: {
                                  stack: [
                                      "JsxAttribute",
                                      "JsxExpression",
                                      "ConditionalExpression",
                                      "Identifier",
                                      "BindingElement",
                                  ],
                                  type: "literal",
                                  node: "Identifier",
                                  kind: "undefined",
                              },
                              kind: "ternary",
                          },
                          whenFalse: {
                              stack: ["JsxAttribute", "JsxExpression", "ConditionalExpression"],
                              type: "literal",
                              node: "Identifier",
                              kind: "undefined",
                          },
                          kind: "ternary",
                      },
                  ],
              },
          ],
          [
              "Stack",
              [
                  ["as", "header"],
                  ["flexWrap", "wrap"],
                  ["alignItems", "flex-end"],
                  ["justifyContent", "flex-end"],
                  ["paddingRight", 2],
                  ["paddingBottom", 2],
                  ["borderBottomWidth", "1px"],
                  ["borderBottomColor", "gray.400"],
                  ["className", null],
                  [
                      "_tablet",
                      {
                          justifyContent: "space-between",
                      },
                  ],
              ],
              {
                  as: [
                      {
                          stack: ["JsxAttribute", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "header",
                          kind: "string",
                      },
                  ],
                  flexWrap: [
                      {
                          stack: ["JsxAttribute", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "wrap",
                          kind: "string",
                      },
                  ],
                  alignItems: [
                      {
                          stack: ["JsxAttribute", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "flex-end",
                          kind: "string",
                      },
                  ],
                  justifyContent: [
                      {
                          stack: ["JsxAttribute", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "flex-end",
                          kind: "string",
                      },
                  ],
                  paddingRight: [
                      {
                          stack: ["JsxAttribute", "JsxExpression", "NumericLiteral"],
                          type: "literal",
                          node: "NumericLiteral",
                          value: 2,
                          kind: "number",
                      },
                  ],
                  paddingBottom: [
                      {
                          stack: ["JsxAttribute", "JsxExpression", "NumericLiteral"],
                          type: "literal",
                          node: "NumericLiteral",
                          value: 2,
                          kind: "number",
                      },
                  ],
                  borderBottomWidth: [
                      {
                          stack: ["JsxAttribute", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "1px",
                          kind: "string",
                      },
                  ],
                  borderBottomColor: [
                      {
                          stack: ["JsxAttribute", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "gray.400",
                          kind: "string",
                      },
                  ],
                  className: [
                      {
                          stack: ["JsxAttribute", "JsxExpression", "PropertyAccessExpression", "Identifier"],
                          type: "unresolvable",
                          node: "Identifier",
                      },
                  ],
                  _tablet: [
                      {
                          stack: ["JsxAttribute", "JsxExpression", "ObjectLiteralExpression"],
                          type: "map",
                          node: "ObjectLiteralExpression",
                          value: {
                              justifyContent: {
                                  stack: [
                                      "JsxAttribute",
                                      "JsxExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "StringLiteral",
                                  ],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "space-between",
                                  kind: "string",
                              },
                          },
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > JsxExpression > CallExpression > ObjectLiteralExpression > PropertyAssignment > TrueKeyword', () => {
  expect(
    extractFromCode(
      `
        <button class={button({ color: "accent", size: "large", rounded: true })}>
        `,
      { tagNameList: [], functionNameList: ['button'] },
    ),
  ).toMatchInlineSnapshot(`
      [
          [
              "button",
              [
                  ["color", "accent"],
                  ["size", "large"],
                  ["rounded", true],
              ],
              {
                  color: [
                      {
                          stack: ["CallExpression", "ObjectLiteralExpression", "PropertyAssignment", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "accent",
                          kind: "string",
                      },
                  ],
                  size: [
                      {
                          stack: ["CallExpression", "ObjectLiteralExpression", "PropertyAssignment", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "large",
                          kind: "string",
                      },
                  ],
                  rounded: [
                      {
                          stack: ["CallExpression", "ObjectLiteralExpression", "PropertyAssignment", "TrueKeyword"],
                          type: "literal",
                          node: "TrueKeyword",
                          value: true,
                          kind: "boolean",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract JsxAttribute > Identifier > StringLiteral tailwind-like', () => {
  expect(
    extractFromCode(
      `
            export function composeClassNames(...classNames: Array<string | undefined>) {
                const classes = classNames
                    .filter((className) => Boolean(className) && className !== " ")
                    .map((className) => className?.toString().trim()) as string[];
                return classes.length === 0 ? undefined : classes.join(" ");
            }

            function clsx (...classNames)  {
                return classNames.reduce((acc, className) => {
                    if (typeof className === "string") {
                        return acc.concat(className);
                    }
                    if (Array.isArray(className)) {
                        return acc.concat(className.filter(Boolean).join(" "));
                    }
                    return acc.concat(Object.entries(className).filter(([, value]) => Boolean(value)).map(([key]) => key))
                }, []).join(" ");
            }

            <div className="bg-slate-100 rounded-xl p-8 dark:bg-slate-800" />
            <div className={isHovered ? ["bg-sky-400", "text-lg"] : "bg-sky-800"} />
            <div className={composeClassNames("bg-sky-400", "text-lg", "bg-sky-800")} />
            <div className={clsx("bg-red-400", { ["bg-white"]: true, shadow: false }, ["rounded", "w-48", "text-sm"])} />

            const [unresolvable] = useState(true);
            <div className={clsx("basic", { ["fine"]: true, stillFine: false, nope: unresolvable })} />
        `,
      { tagNameList: ['div'] },
    ),
  ).toMatchInlineSnapshot(`
      [
          [
              "div",
              [
                  [
                      "className",
                      [
                          "bg-slate-100 rounded-xl p-8 dark:bg-slate-800",
                          ["bg-sky-400", "text-lg", "bg-sky-800"],
                          "bg-sky-400 text-lg bg-sky-800",
                          "bg-red-400 bg-white rounded w-48 text-sm",
                      ],
                  ],
              ],
              {
                  className: [
                      {
                          stack: ["JsxAttribute", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "bg-slate-100 rounded-xl p-8 dark:bg-slate-800",
                          kind: "string",
                      },
                      {
                          stack: ["JsxAttribute", "JsxExpression", "ConditionalExpression"],
                          type: "conditional",
                          node: "ConditionalExpression",
                          whenTrue: {
                              stack: ["JsxAttribute", "JsxExpression", "ConditionalExpression"],
                              type: "list",
                              node: "ArrayLiteralExpression",
                              value: [
                                  {
                                      stack: ["JsxAttribute", "JsxExpression", "ConditionalExpression"],
                                      type: "literal",
                                      node: "StringLiteral",
                                      value: "bg-sky-400",
                                      kind: "string",
                                  },
                                  {
                                      stack: ["JsxAttribute", "JsxExpression", "ConditionalExpression"],
                                      type: "literal",
                                      node: "StringLiteral",
                                      value: "text-lg",
                                      kind: "string",
                                  },
                              ],
                          },
                          whenFalse: {
                              stack: ["JsxAttribute", "JsxExpression", "ConditionalExpression"],
                              type: "literal",
                              node: "StringLiteral",
                              value: "bg-sky-800",
                              kind: "string",
                          },
                          kind: "ternary",
                      },
                      {
                          stack: ["JsxAttribute", "JsxExpression", "CallExpression"],
                          type: "literal",
                          node: "CallExpression",
                          value: "bg-sky-400 text-lg bg-sky-800",
                          kind: "string",
                      },
                      {
                          stack: ["JsxAttribute", "JsxExpression", "CallExpression"],
                          type: "literal",
                          node: "CallExpression",
                          value: "bg-red-400 bg-white rounded w-48 text-sm",
                          kind: "string",
                      },
                      {
                          stack: ["JsxAttribute", "JsxExpression", "CallExpression"],
                          type: "unresolvable",
                          node: "CallExpression",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract defineProperties config', () => {
  const extractMap = new Map()
  extractFromCode(
    `
    const tw = defineProperties({
        conditions: {
            small: { selector: ".small &" },
            large: { selector: ".large &" },
            dark: { selector: ".dark &" },
            light: { selector: ".light &" },
            hover: { selector: "&:hover" },
            navItem: { selector: 'nav li > &' },
            hoverNotActive: { selector: '&:hover:not(:active)' }
        },
        defaultCondition: "small",
        properties: {
            display: true,
            color: tokens.colors,
            backgroundColor: tokens.colors,
            borderColor: tokens.colors,
            borderRadius: tokens.radii,
            padding: {
                4: "4px",
                8: "8px",
                12: "12px",
                16: "16px",
                20: "20px",
                24: "24px",
            },
            width: {
                "1/2": "50%",
            },
        },
        shorthands: {
            d: ["display"],
            w: ["width"],
            bg: ["backgroundColor"],
            p: ["padding"],
            rounded: ["borderRadius"],
        },
    });
    `,
    { functionNameList: ['defineProperties'], extractMap },
  )
  const definePropsConfig = extractMap.get('defineProperties') as ExtractedFunctionResult

  expect(definePropsConfig.queryList).toMatchInlineSnapshot(`
      [
          {
              name: "defineProperties",
              box: {
                  stack: [],
                  type: "list",
                  node: "CallExpression",
                  value: [
                      {
                          stack: ["CallExpression", "ObjectLiteralExpression"],
                          type: "map",
                          node: "CallExpression",
                          value: {
                              conditions: {
                                  stack: [
                                      "CallExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "ObjectLiteralExpression",
                                  ],
                                  type: "map",
                                  node: "ObjectLiteralExpression",
                                  value: {
                                      small: {
                                          stack: [
                                              "CallExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                          ],
                                          type: "map",
                                          node: "ObjectLiteralExpression",
                                          value: {
                                              selector: {
                                                  stack: [
                                                      "CallExpression",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "StringLiteral",
                                                  ],
                                                  type: "literal",
                                                  node: "StringLiteral",
                                                  value: ".small &",
                                                  kind: "string",
                                              },
                                          },
                                      },
                                      large: {
                                          stack: [
                                              "CallExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                          ],
                                          type: "map",
                                          node: "ObjectLiteralExpression",
                                          value: {
                                              selector: {
                                                  stack: [
                                                      "CallExpression",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "StringLiteral",
                                                  ],
                                                  type: "literal",
                                                  node: "StringLiteral",
                                                  value: ".large &",
                                                  kind: "string",
                                              },
                                          },
                                      },
                                      dark: {
                                          stack: [
                                              "CallExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                          ],
                                          type: "map",
                                          node: "ObjectLiteralExpression",
                                          value: {
                                              selector: {
                                                  stack: [
                                                      "CallExpression",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "StringLiteral",
                                                  ],
                                                  type: "literal",
                                                  node: "StringLiteral",
                                                  value: ".dark &",
                                                  kind: "string",
                                              },
                                          },
                                      },
                                      light: {
                                          stack: [
                                              "CallExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                          ],
                                          type: "map",
                                          node: "ObjectLiteralExpression",
                                          value: {
                                              selector: {
                                                  stack: [
                                                      "CallExpression",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "StringLiteral",
                                                  ],
                                                  type: "literal",
                                                  node: "StringLiteral",
                                                  value: ".light &",
                                                  kind: "string",
                                              },
                                          },
                                      },
                                      hover: {
                                          stack: [
                                              "CallExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                          ],
                                          type: "map",
                                          node: "ObjectLiteralExpression",
                                          value: {
                                              selector: {
                                                  stack: [
                                                      "CallExpression",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "StringLiteral",
                                                  ],
                                                  type: "literal",
                                                  node: "StringLiteral",
                                                  value: "&:hover",
                                                  kind: "string",
                                              },
                                          },
                                      },
                                      navItem: {
                                          stack: [
                                              "CallExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                          ],
                                          type: "map",
                                          node: "ObjectLiteralExpression",
                                          value: {
                                              selector: {
                                                  stack: [
                                                      "CallExpression",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "StringLiteral",
                                                  ],
                                                  type: "literal",
                                                  node: "StringLiteral",
                                                  value: "nav li > &",
                                                  kind: "string",
                                              },
                                          },
                                      },
                                      hoverNotActive: {
                                          stack: [
                                              "CallExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                          ],
                                          type: "map",
                                          node: "ObjectLiteralExpression",
                                          value: {
                                              selector: {
                                                  stack: [
                                                      "CallExpression",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "StringLiteral",
                                                  ],
                                                  type: "literal",
                                                  node: "StringLiteral",
                                                  value: "&:hover:not(:active)",
                                                  kind: "string",
                                              },
                                          },
                                      },
                                  },
                              },
                              defaultCondition: {
                                  stack: ["CallExpression", "ObjectLiteralExpression", "PropertyAssignment", "StringLiteral"],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "small",
                                  kind: "string",
                              },
                              properties: {
                                  stack: [
                                      "CallExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "ObjectLiteralExpression",
                                  ],
                                  type: "map",
                                  node: "ObjectLiteralExpression",
                                  value: {
                                      display: {
                                          stack: [
                                              "CallExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "TrueKeyword",
                                          ],
                                          type: "literal",
                                          node: "TrueKeyword",
                                          value: true,
                                          kind: "boolean",
                                      },
                                      color: {
                                          stack: [
                                              "CallExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "PropertyAccessExpression",
                                              "Identifier",
                                          ],
                                          type: "unresolvable",
                                          node: "Identifier",
                                      },
                                      backgroundColor: {
                                          stack: [
                                              "CallExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "PropertyAccessExpression",
                                              "Identifier",
                                          ],
                                          type: "unresolvable",
                                          node: "Identifier",
                                      },
                                      borderColor: {
                                          stack: [
                                              "CallExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "PropertyAccessExpression",
                                              "Identifier",
                                          ],
                                          type: "unresolvable",
                                          node: "Identifier",
                                      },
                                      borderRadius: {
                                          stack: [
                                              "CallExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "PropertyAccessExpression",
                                              "Identifier",
                                          ],
                                          type: "unresolvable",
                                          node: "Identifier",
                                      },
                                      padding: {
                                          stack: [
                                              "CallExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                          ],
                                          type: "map",
                                          node: "ObjectLiteralExpression",
                                          value: {
                                              "4": {
                                                  stack: [
                                                      "CallExpression",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "StringLiteral",
                                                  ],
                                                  type: "literal",
                                                  node: "StringLiteral",
                                                  value: "4px",
                                                  kind: "string",
                                              },
                                              "8": {
                                                  stack: [
                                                      "CallExpression",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "StringLiteral",
                                                  ],
                                                  type: "literal",
                                                  node: "StringLiteral",
                                                  value: "8px",
                                                  kind: "string",
                                              },
                                              "12": {
                                                  stack: [
                                                      "CallExpression",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "StringLiteral",
                                                  ],
                                                  type: "literal",
                                                  node: "StringLiteral",
                                                  value: "12px",
                                                  kind: "string",
                                              },
                                              "16": {
                                                  stack: [
                                                      "CallExpression",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "StringLiteral",
                                                  ],
                                                  type: "literal",
                                                  node: "StringLiteral",
                                                  value: "16px",
                                                  kind: "string",
                                              },
                                              "20": {
                                                  stack: [
                                                      "CallExpression",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "StringLiteral",
                                                  ],
                                                  type: "literal",
                                                  node: "StringLiteral",
                                                  value: "20px",
                                                  kind: "string",
                                              },
                                              "24": {
                                                  stack: [
                                                      "CallExpression",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "StringLiteral",
                                                  ],
                                                  type: "literal",
                                                  node: "StringLiteral",
                                                  value: "24px",
                                                  kind: "string",
                                              },
                                          },
                                      },
                                      width: {
                                          stack: [
                                              "CallExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                          ],
                                          type: "map",
                                          node: "ObjectLiteralExpression",
                                          value: {
                                              "1/2": {
                                                  stack: [
                                                      "CallExpression",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "StringLiteral",
                                                  ],
                                                  type: "literal",
                                                  node: "StringLiteral",
                                                  value: "50%",
                                                  kind: "string",
                                              },
                                          },
                                      },
                                  },
                              },
                              shorthands: {
                                  stack: [
                                      "CallExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "ObjectLiteralExpression",
                                  ],
                                  type: "map",
                                  node: "ObjectLiteralExpression",
                                  value: {
                                      d: {
                                          stack: [
                                              "CallExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ArrayLiteralExpression",
                                          ],
                                          type: "list",
                                          node: "ArrayLiteralExpression",
                                          value: [
                                              {
                                                  stack: [
                                                      "CallExpression",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ArrayLiteralExpression",
                                                  ],
                                                  type: "literal",
                                                  node: "StringLiteral",
                                                  value: "display",
                                                  kind: "string",
                                              },
                                          ],
                                      },
                                      w: {
                                          stack: [
                                              "CallExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ArrayLiteralExpression",
                                          ],
                                          type: "list",
                                          node: "ArrayLiteralExpression",
                                          value: [
                                              {
                                                  stack: [
                                                      "CallExpression",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ArrayLiteralExpression",
                                                  ],
                                                  type: "literal",
                                                  node: "StringLiteral",
                                                  value: "width",
                                                  kind: "string",
                                              },
                                          ],
                                      },
                                      bg: {
                                          stack: [
                                              "CallExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ArrayLiteralExpression",
                                          ],
                                          type: "list",
                                          node: "ArrayLiteralExpression",
                                          value: [
                                              {
                                                  stack: [
                                                      "CallExpression",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ArrayLiteralExpression",
                                                  ],
                                                  type: "literal",
                                                  node: "StringLiteral",
                                                  value: "backgroundColor",
                                                  kind: "string",
                                              },
                                          ],
                                      },
                                      p: {
                                          stack: [
                                              "CallExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ArrayLiteralExpression",
                                          ],
                                          type: "list",
                                          node: "ArrayLiteralExpression",
                                          value: [
                                              {
                                                  stack: [
                                                      "CallExpression",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ArrayLiteralExpression",
                                                  ],
                                                  type: "literal",
                                                  node: "StringLiteral",
                                                  value: "padding",
                                                  kind: "string",
                                              },
                                          ],
                                      },
                                      rounded: {
                                          stack: [
                                              "CallExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ArrayLiteralExpression",
                                          ],
                                          type: "list",
                                          node: "ArrayLiteralExpression",
                                          value: [
                                              {
                                                  stack: [
                                                      "CallExpression",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ArrayLiteralExpression",
                                                  ],
                                                  type: "literal",
                                                  node: "StringLiteral",
                                                  value: "borderRadius",
                                                  kind: "string",
                                              },
                                          ],
                                      },
                                  },
                              },
                          },
                      },
                  ],
              },
          },
      ]
    `)
})

it('extract CallExpression > ObjectLiteralExpression > PropertyAssignment > Identifier > ArrayBindingPattern', () => {
  expect(
    extractFromCode(
      `
            export const [coreThemeClass, coreThemeVars] = [
                "_1dghp000",
                {
                  "backgroundColor": {
                    "error": "var(--backgroundColor-error__1dghp00s)",
                    "warning": "var(--backgroundColor-warning__1dghp00t)"
                  },
                }
              ];

            export const properties = defineProperties({
            properties: {
                display: true,
                backgroundColor: coreThemeVars.backgroundColor,
            },
            shorthands: {
                margin: ["marginTop"],
            }
            });
        `,
      { tagNameList: [], functionNameList: ['defineProperties'] },
    ),
  ).toMatchInlineSnapshot(`
      [
          [
              "defineProperties",
              [
                  [
                      "properties",
                      {
                          display: true,
                          backgroundColor: {
                              error: "var(--backgroundColor-error__1dghp00s)",
                              warning: "var(--backgroundColor-warning__1dghp00t)",
                          },
                      },
                  ],
                  [
                      "shorthands",
                      {
                          margin: ["marginTop"],
                      },
                  ],
              ],
              {
                  properties: [
                      {
                          stack: [
                              "CallExpression",
                              "ObjectLiteralExpression",
                              "PropertyAssignment",
                              "ObjectLiteralExpression",
                          ],
                          type: "map",
                          node: "ObjectLiteralExpression",
                          value: {
                              display: {
                                  stack: [
                                      "CallExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "TrueKeyword",
                                  ],
                                  type: "literal",
                                  node: "TrueKeyword",
                                  value: true,
                                  kind: "boolean",
                              },
                              backgroundColor: {
                                  stack: [
                                      "CallExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "PropertyAccessExpression",
                                      "Identifier",
                                      "Identifier",
                                      "BindingElement",
                                      "ArrayLiteralExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "ObjectLiteralExpression",
                                  ],
                                  type: "map",
                                  node: "ObjectLiteralExpression",
                                  value: {
                                      error: {
                                          stack: [
                                              "CallExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "PropertyAccessExpression",
                                              "Identifier",
                                              "Identifier",
                                              "BindingElement",
                                              "ArrayLiteralExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "StringLiteral",
                                          ],
                                          type: "literal",
                                          node: "StringLiteral",
                                          value: "var(--backgroundColor-error__1dghp00s)",
                                          kind: "string",
                                      },
                                      warning: {
                                          stack: [
                                              "CallExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "PropertyAccessExpression",
                                              "Identifier",
                                              "Identifier",
                                              "BindingElement",
                                              "ArrayLiteralExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "StringLiteral",
                                          ],
                                          type: "literal",
                                          node: "StringLiteral",
                                          value: "var(--backgroundColor-warning__1dghp00t)",
                                          kind: "string",
                                      },
                                  },
                              },
                          },
                      },
                  ],
                  shorthands: [
                      {
                          stack: [
                              "CallExpression",
                              "ObjectLiteralExpression",
                              "PropertyAssignment",
                              "ObjectLiteralExpression",
                          ],
                          type: "map",
                          node: "ObjectLiteralExpression",
                          value: {
                              margin: {
                                  stack: [
                                      "CallExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "ArrayLiteralExpression",
                                  ],
                                  type: "list",
                                  node: "ArrayLiteralExpression",
                                  value: [
                                      {
                                          stack: [
                                              "CallExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ArrayLiteralExpression",
                                          ],
                                          type: "literal",
                                          node: "StringLiteral",
                                          value: "marginTop",
                                          kind: "string",
                                      },
                                  ],
                              },
                          },
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract function with multiple args even if not starting by ObjectLiteralExpression - CallExpression > StringLiteral + ObjectLiteralExpression > *', () => {
  const extracted = getExtract(
    `
        export const primary = {
            "50": "#cdd5ed",
            "100": "#a7b6df",
            "200": "#95a7d8",
            "300": "#8297d1",
            "400": "#6f88cb",
            "500": "#4a69bd",
            "600": "#39539b",
            "700": "#324989",
            "800": "#2b3f76",
            "900": "#1d2b51",
        } as const;

        export const lightThemeVars = createTheme("contract", {
            color: {
                mainBg: primary["200"],
                // secondaryBg: primary["300"],
                // text: primary["400"],
                // bg: primary["600"],
                // bgSecondary: primary["400"],
                // bgHover: primary["100"],
            },
        });
        `,
    { tagNameList: [], functionNameList: ['createTheme'] },
  )

  expect(extracted.get('createTheme')!.queryList).toMatchInlineSnapshot(`
      [
          {
              name: "createTheme",
              box: {
                  stack: [],
                  type: "list",
                  node: "CallExpression",
                  value: [
                      {
                          stack: ["CallExpression", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "contract",
                          kind: "string",
                      },
                      {
                          stack: ["CallExpression", "ObjectLiteralExpression"],
                          type: "map",
                          node: "CallExpression",
                          value: {
                              color: {
                                  stack: [
                                      "CallExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "ObjectLiteralExpression",
                                  ],
                                  type: "map",
                                  node: "ObjectLiteralExpression",
                                  value: {
                                      mainBg: {
                                          stack: [
                                              "CallExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ElementAccessExpression",
                                              "Identifier",
                                              "StringLiteral",
                                              "Identifier",
                                              "VariableDeclaration",
                                              "PropertyAssignment",
                                          ],
                                          type: "literal",
                                          node: "StringLiteral",
                                          value: "#95a7d8",
                                          kind: "string",
                                      },
                                  },
                              },
                          },
                      },
                  ],
              },
          },
      ]
    `)
})

// TODO nested valueOrNullable ?? fallback ?? fallback

it('extract NullKeyword', () => {
  const extracted = getExtract(
    `
        export const colorModeVars = createTheme("contract", {
            color: {
                mainBg: null,
                secondaryBg: null,
                text: null,
                bg: null,
                bgSecondary: null,
                bgHover: null,
            },
        });
        `,
    { tagNameList: [], functionNameList: ['createTheme'] },
  )

  expect(extracted.get('createTheme')!.queryList).toMatchInlineSnapshot(`
      [
          {
              name: "createTheme",
              box: {
                  stack: [],
                  type: "list",
                  node: "CallExpression",
                  value: [
                      {
                          stack: ["CallExpression", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "contract",
                          kind: "string",
                      },
                      {
                          stack: ["CallExpression", "ObjectLiteralExpression"],
                          type: "map",
                          node: "CallExpression",
                          value: {
                              color: {
                                  stack: [
                                      "CallExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "ObjectLiteralExpression",
                                  ],
                                  type: "map",
                                  node: "ObjectLiteralExpression",
                                  value: {
                                      mainBg: {
                                          stack: [
                                              "CallExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "NullKeyword",
                                          ],
                                          type: "literal",
                                          node: "NullKeyword",
                                          value: null,
                                          kind: "null",
                                      },
                                      secondaryBg: {
                                          stack: [
                                              "CallExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "NullKeyword",
                                          ],
                                          type: "literal",
                                          node: "NullKeyword",
                                          value: null,
                                          kind: "null",
                                      },
                                      text: {
                                          stack: [
                                              "CallExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "NullKeyword",
                                          ],
                                          type: "literal",
                                          node: "NullKeyword",
                                          value: null,
                                          kind: "null",
                                      },
                                      bg: {
                                          stack: [
                                              "CallExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "NullKeyword",
                                          ],
                                          type: "literal",
                                          node: "NullKeyword",
                                          value: null,
                                          kind: "null",
                                      },
                                      bgSecondary: {
                                          stack: [
                                              "CallExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "NullKeyword",
                                          ],
                                          type: "literal",
                                          node: "NullKeyword",
                                          value: null,
                                          kind: "null",
                                      },
                                      bgHover: {
                                          stack: [
                                              "CallExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "NullKeyword",
                                          ],
                                          type: "literal",
                                          node: "NullKeyword",
                                          value: null,
                                          kind: "null",
                                      },
                                  },
                              },
                          },
                      },
                  ],
              },
          },
      ]
    `)
})

it('extract UndefinedKeyword', () => {
  expect(extractFromCode(`<ColorBox color={undefined} />`)).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", null]],
              {
                  color: [
                      {
                          stack: ["JsxAttribute", "JsxExpression", "Identifier"],
                          type: "literal",
                          node: "Identifier",
                          kind: "undefined",
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract css from createTheme result', () => {
  const extracted = getExtract(
    `
    const colorModeVars = {
        "color": {
            "mainBg": "var(--color-mainBg__1du39r70)",
            "secondaryBg": "var(--color-secondaryBg__1du39r71)",
            "text": "var(--color-text__1du39r72)",
            "bg": "var(--color-bg__1du39r73)",
            "bgSecondary": "var(--color-bgSecondary__1du39r74)",
            "bgHover": "var(--color-bgHover__1du39r75)"
        }
    } as const;

    css(
        {
            background: \`linear-gradient(to bottom, \${colorModeVars.color.mainBg} 20%, \${colorModeVars.color.secondaryBg})\`,
            backgroundAttachment: "fixed",
            color: colorModeVars.color.text,
        }
    );

`,
    { functionNameList: ['css'] },
  )

  expect(extracted.get('css')!.queryList).toMatchInlineSnapshot(`
      [
          {
              name: "css",
              box: {
                  stack: [],
                  type: "list",
                  node: "CallExpression",
                  value: [
                      {
                          stack: ["CallExpression", "ObjectLiteralExpression"],
                          type: "map",
                          node: "CallExpression",
                          value: {
                              background: {
                                  stack: [
                                      "CallExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "TemplateExpression",
                                      "PropertyAccessExpression",
                                      "Identifier",
                                      "Identifier",
                                      "VariableDeclaration",
                                      "ObjectLiteralExpression",
                                      "PropertyAccessExpression",
                                      "Identifier",
                                      "Identifier",
                                      "VariableDeclaration",
                                      "ObjectLiteralExpression",
                                  ],
                                  type: "literal",
                                  node: "TemplateExpression",
                                  value: "linear-gradient(to bottom, var(--color-mainBg__1du39r70) 20%, var(--color-secondaryBg__1du39r71))",
                                  kind: "string",
                              },
                              backgroundAttachment: {
                                  stack: ["CallExpression", "ObjectLiteralExpression", "PropertyAssignment", "StringLiteral"],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "fixed",
                                  kind: "string",
                              },
                              color: {
                                  stack: [
                                      "CallExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "PropertyAccessExpression",
                                      "PropertyAccessExpression",
                                      "Identifier",
                                      "Identifier",
                                      "VariableDeclaration",
                                      "PropertyAssignment",
                                      "PropertyAssignment",
                                  ],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "var(--color-text__1du39r72)",
                                  kind: "string",
                              },
                          },
                      },
                  ],
              },
          },
      ]
    `)
})

it('extract assignVars args', () => {
  const extracted = getExtract(
    `
        export const primary = {
            "50": "#cdd5ed",
            "100": "#a7b6df",
            "200": "#95a7d8",
            "300": "#8297d1",
            "400": "#6f88cb",
            "500": "#4a69bd",
            "600": "#39539b",
            "700": "#324989",
            "800": "#2b3f76",
            "900": "#1d2b51",
        } as const;


        const darkVars = assignVars(colorModeVars, {
            color: {
                mainBg: primary["600"],
                secondaryBg: primary["700"],
                bg: primary["300"],
                bgSecondary: primary["800"],
                bgHover: primary["700"],
            },
        });
`,
    { functionNameList: ['assignVars'] },
  )

  expect(extracted.get('assignVars')!.queryList).toMatchInlineSnapshot(`
      [
          {
              name: "assignVars",
              box: {
                  stack: [],
                  type: "list",
                  node: "CallExpression",
                  value: [
                      {
                          stack: ["CallExpression", "Identifier"],
                          type: "unresolvable",
                          node: "Identifier",
                      },
                      {
                          stack: ["CallExpression", "ObjectLiteralExpression"],
                          type: "map",
                          node: "CallExpression",
                          value: {
                              color: {
                                  stack: [
                                      "CallExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "ObjectLiteralExpression",
                                  ],
                                  type: "map",
                                  node: "ObjectLiteralExpression",
                                  value: {
                                      mainBg: {
                                          stack: [
                                              "CallExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ElementAccessExpression",
                                              "Identifier",
                                              "StringLiteral",
                                              "Identifier",
                                              "VariableDeclaration",
                                              "PropertyAssignment",
                                          ],
                                          type: "literal",
                                          node: "StringLiteral",
                                          value: "#39539b",
                                          kind: "string",
                                      },
                                      secondaryBg: {
                                          stack: [
                                              "CallExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ElementAccessExpression",
                                              "Identifier",
                                              "StringLiteral",
                                              "Identifier",
                                              "VariableDeclaration",
                                              "PropertyAssignment",
                                          ],
                                          type: "literal",
                                          node: "StringLiteral",
                                          value: "#324989",
                                          kind: "string",
                                      },
                                      bg: {
                                          stack: [
                                              "CallExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ElementAccessExpression",
                                              "Identifier",
                                              "StringLiteral",
                                              "Identifier",
                                              "VariableDeclaration",
                                              "PropertyAssignment",
                                          ],
                                          type: "literal",
                                          node: "StringLiteral",
                                          value: "#8297d1",
                                          kind: "string",
                                      },
                                      bgSecondary: {
                                          stack: [
                                              "CallExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ElementAccessExpression",
                                              "Identifier",
                                              "StringLiteral",
                                              "Identifier",
                                              "VariableDeclaration",
                                              "PropertyAssignment",
                                          ],
                                          type: "literal",
                                          node: "StringLiteral",
                                          value: "#2b3f76",
                                          kind: "string",
                                      },
                                      bgHover: {
                                          stack: [
                                              "CallExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ElementAccessExpression",
                                              "Identifier",
                                              "StringLiteral",
                                              "Identifier",
                                              "VariableDeclaration",
                                              "PropertyAssignment",
                                          ],
                                          type: "literal",
                                          node: "StringLiteral",
                                          value: "#324989",
                                          kind: "string",
                                      },
                                  },
                              },
                          },
                      },
                  ],
              },
          },
      ]
    `)
})

it('extract CallExpression > no args', () => {
  expect(
    getExtract(
      `
            const css = defineProperties()
        `,
      { functionNameList: ['defineProperties'] },
    ),
  ).toMatchInlineSnapshot(`
      {
          defineProperties: {
              kind: "function",
              nodesByProp: {},
              queryList: [
                  {
                      name: "defineProperties",
                      box: {
                          stack: [],
                          type: "list",
                          node: "CallExpression",
                          value: [],
                      },
                  },
              ],
          },
      }
    `)
})

it('extract CallExpression nested ObjectLiteralExpression', () => {
  expect(
    extractFromCode(
      `
        import { css } from '.xxx/css'

        console.log(
          console.log(
            css({
              selectors: {
                '&:hover': {
                  background: 'red.200',
                },
              },
            }),
          ),
        )
        `,
      { functionNameList: ['css'] },
    ),
  ).toMatchInlineSnapshot(`
      [
          [
              "css",
              [
                  [
                      "selectors",
                      {
                          "&:hover": {
                              background: "red.200",
                          },
                      },
                  ],
              ],
              {
                  selectors: [
                      {
                          stack: [
                              "CallExpression",
                              "ObjectLiteralExpression",
                              "PropertyAssignment",
                              "ObjectLiteralExpression",
                          ],
                          type: "map",
                          node: "ObjectLiteralExpression",
                          value: {
                              "&:hover": {
                                  stack: [
                                      "CallExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "ObjectLiteralExpression",
                                  ],
                                  type: "map",
                                  node: "ObjectLiteralExpression",
                                  value: {
                                      background: {
                                          stack: [
                                              "CallExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "StringLiteral",
                                          ],
                                          type: "literal",
                                          node: "StringLiteral",
                                          value: "red.200",
                                          kind: "string",
                                      },
                                  },
                              },
                          },
                      },
                  ],
              },
          ],
      ]
    `)
})

it('extract CallExpression nested ObjectLiteralExpression', () => {
  expect(
    extractFromCode(
      `
            import { factory } from '../design-system/jsx'
            import { cva } from '../design-system/css'

            export const badge = cva({
              base: {
                fontWeight: 'medium',
                letterSpacing: 'wide',
                flexGrow: '0',
                px: '3',
                alignSelf: 'flex-start',
                borderRadius: 'md',
              },
              variants: {
                status: {
                  default: {
                    color: 'white',
                    bg: 'gray.500',
                  },
                  success: {
                    color: 'white',
                    bg: 'green.500',
                  },
                  warning: {
                    color: 'white',
                    bg: 'yellow.500',
                  },
                },
              },
              defaultVariants: {
                status: 'default',
              },
            })

            export const Badge = factory('span', badge)

        `,
      { functionNameList: ['factory'] },
    ),
  ).toMatchInlineSnapshot('[["factory", [], {}]]')
})

it('handles multiline string literal', () => {
  expect(
    extractFromCode(
      `<div
    marginTop="3"
    display="flex"
    flexDir="column"
    background="#e879f91a"
    backgroundSize="8px 8px"
    style={{
      gap,
      backgroundImage: \`linear-gradient(
        135deg,
        #d946ef80 10%,
        transparent 0,
        transparent 50%,
        #d946ef80 0,
        #d946ef80 60%,
        transparent 0,
        transparent
      )\`,
    }}
  >
    {spacingItems}
  </div>`,
      { tagNameList: ['div'] },
    ),
  ).toMatchInlineSnapshot(`
      [
          [
              "div",
              [
                  ["marginTop", "3"],
                  ["display", "flex"],
                  ["flexDir", "column"],
                  ["background", "#e879f91a"],
                  ["backgroundSize", "8px 8px"],
                  [
                      "style",
                      {
                          backgroundImage:
                              "linear-gradient( 135deg, #d946ef80 10%, transparent 0, transparent 50%, #d946ef80 0, #d946ef80 60%, transparent 0, transparent )",
                      },
                  ],
              ],
              {
                  marginTop: [
                      {
                          stack: ["JsxAttribute", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "3",
                          kind: "string",
                      },
                  ],
                  display: [
                      {
                          stack: ["JsxAttribute", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "flex",
                          kind: "string",
                      },
                  ],
                  flexDir: [
                      {
                          stack: ["JsxAttribute", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "column",
                          kind: "string",
                      },
                  ],
                  background: [
                      {
                          stack: ["JsxAttribute", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "#e879f91a",
                          kind: "string",
                      },
                  ],
                  backgroundSize: [
                      {
                          stack: ["JsxAttribute", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "8px 8px",
                          kind: "string",
                      },
                  ],
                  style: [
                      {
                          stack: ["JsxAttribute", "JsxExpression", "ObjectLiteralExpression"],
                          type: "map",
                          node: "ObjectLiteralExpression",
                          value: {
                              backgroundImage: {
                                  stack: [
                                      "JsxAttribute",
                                      "JsxExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "NoSubstitutionTemplateLiteral",
                                  ],
                                  type: "literal",
                                  node: "NoSubstitutionTemplateLiteral",
                                  value: "linear-gradient( 135deg, #d946ef80 10%, transparent 0, transparent 50%, #d946ef80 0, #d946ef80 60%, transparent 0, transparent )",
                                  kind: "string",
                              },
                          },
                      },
                  ],
              },
          ],
      ]
    `)
})
