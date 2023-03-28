import * as path from 'node:path'
import { SourceFile, ts } from 'ts-morph'
import { expect, it } from 'vitest'
import { getBoxLiteralValue } from '../src/getBoxLiteralValue'
import { createProject, getTestExtract, TestExtractOptions } from './createProject'

const project = createProject()
const getExtract = (code: string, options: TestExtractOptions) => getTestExtract(project, code, options)

const extractFromCode = (codeOrSource: string | SourceFile, options?: TestExtractOptions) => {
  const code =
    typeof codeOrSource === 'string'
      ? project.createSourceFile('file.tsx', codeOrSource, { overwrite: true, scriptKind: ts.ScriptKind.TSX })
      : codeOrSource
  const extracted = getExtract(code.getFullText(), { ...options })
  return Array.from(extracted.entries()).map(([name, props]) => [
    name,
    Array.from(props.nodesByProp.entries()).map(([propName, propValues]) => [propName, getBoxLiteralValue(propValues)]),
    extracted.get(name)!.nodesByProp,
  ])
}

it('extract example.css.ts defineProperties arg result', () => {
  const sourceFile = project.addSourceFileAtPath(path.resolve(__dirname, './sample-files-split/example.css.ts'))

  expect(extractFromCode(sourceFile, { functionNameList: ['defineProperties'] })).toMatchInlineSnapshot(
    `
      [
          [
              "defineProperties",
              [
                  [
                      "conditions",
                      {
                          mobile: {
                              "@media": "(min-width: 320px)",
                          },
                          tablet: {
                              "@media": "(min-width: 768px)",
                          },
                          desktop: {
                              "@media": "(min-width: 1024px)",
                          },
                          idle: {},
                          focus: {
                              selector: "&:focus",
                          },
                          hover: {
                              selector: "&:hover",
                          },
                      },
                  ],
                  ["defaultCondition", "idle"],
                  [
                      "properties",
                      {
                          position: ["relative", "absolute"],
                          display: ["block", "inline-block", "flex", "inline-flex"],
                          color: {
                              main: "#d2a8ff",
                              secondary: "#7ee787",
                              brand: "red",
                              other: "blue",
                          },
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
                  conditions: [
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
                              mobile: {
                                  stack: [
                                      "CallExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "ObjectLiteralExpression",
                                      "SpreadAssignment",
                                      "CallExpression",
                                  ],
                                  type: "object",
                                  node: "CallExpression",
                                  value: {
                                      "@media": "(min-width: 320px)",
                                  },
                              },
                              tablet: {
                                  stack: [
                                      "CallExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "ObjectLiteralExpression",
                                      "SpreadAssignment",
                                      "CallExpression",
                                  ],
                                  type: "object",
                                  node: "CallExpression",
                                  value: {
                                      "@media": "(min-width: 768px)",
                                  },
                              },
                              desktop: {
                                  stack: [
                                      "CallExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "ObjectLiteralExpression",
                                      "SpreadAssignment",
                                      "CallExpression",
                                  ],
                                  type: "object",
                                  node: "CallExpression",
                                  value: {
                                      "@media": "(min-width: 1024px)",
                                  },
                              },
                              idle: {
                                  stack: [
                                      "CallExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "ObjectLiteralExpression",
                                  ],
                                  type: "object",
                                  node: "ObjectLiteralExpression",
                                  value: {},
                                  isEmpty: true,
                              },
                              focus: {
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
                                          value: "&:focus",
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
                          },
                      },
                  ],
                  defaultCondition: [
                      {
                          stack: ["CallExpression", "ObjectLiteralExpression", "PropertyAssignment", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "idle",
                          kind: "string",
                      },
                  ],
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
                              color: {
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
                                      main: {
                                          stack: [
                                              "CallExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "SpreadAssignment",
                                              "Identifier",
                                              "Identifier",
                                              "VariableDeclaration",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "StringLiteral",
                                          ],
                                          type: "literal",
                                          node: "StringLiteral",
                                          value: "#d2a8ff",
                                          kind: "string",
                                      },
                                      secondary: {
                                          stack: [
                                              "CallExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "SpreadAssignment",
                                              "Identifier",
                                              "Identifier",
                                              "VariableDeclaration",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "StringLiteral",
                                          ],
                                          type: "literal",
                                          node: "StringLiteral",
                                          value: "#7ee787",
                                          kind: "string",
                                      },
                                      brand: {
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
                                          value: "red",
                                          kind: "string",
                                      },
                                      other: {
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
                                          value: "blue",
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
    `,
  )
})

// run this instead of the test to see the output, from `packages/cli`
// DEBUG=box* ./bin.js -i /Users/astahmer/dev/alex/vite-box-extractor/packages/box-extractor/tests/samples/lightVars.ts --functions=assignVars -o /Users/astahmer/dev/alex/vite-box-extractor/packages/box-extractor/tests/samples/lightVars.json
it.skip('extract lightVars.ts assignVars using another file values', () => {
  const sourceFile = project.addSourceFileAtPath(path.resolve(__dirname, './samples/lightVars.ts'))
  project.resolveSourceFileDependencies()

  expect(extractFromCode(sourceFile, { functionNameList: ['assignVars'] })).toMatchInlineSnapshot(`
      [
          [
              "assignVars",
              [
                  [
                      "color",
                      {
                          mainBg: "#95a7d8",
                          secondaryBg: "#8297d1",
                          text: "#4299e1",
                          bg: "#39539b",
                          bgSecondary: "#6f88cb",
                          bgHover: "#a7b6df",
                      },
                  ],
              ],
              {
                  color: [
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
                              mainBg: [
                                  {
                                      stack: [
                                          "CallExpression",
                                          "ObjectLiteralExpression",
                                          "PropertyAssignment",
                                          "ObjectLiteralExpression",
                                          "PropertyAssignment",
                                          "ElementAccessExpression",
                                          "Identifier",
                                          "StringLiteral",
                                      ],
                                      type: "literal",
                                      node: "Identifier",
                                      value: "#95a7d8",
                                      kind: "string",
                                  },
                              ],
                              secondaryBg: [
                                  {
                                      stack: [
                                          "CallExpression",
                                          "ObjectLiteralExpression",
                                          "PropertyAssignment",
                                          "ObjectLiteralExpression",
                                          "PropertyAssignment",
                                          "ElementAccessExpression",
                                          "Identifier",
                                          "StringLiteral",
                                      ],
                                      type: "literal",
                                      node: "Identifier",
                                      value: "#8297d1",
                                      kind: "string",
                                  },
                              ],
                              text: [
                                  {
                                      stack: [
                                          "CallExpression",
                                          "ObjectLiteralExpression",
                                          "PropertyAssignment",
                                          "ObjectLiteralExpression",
                                          "PropertyAssignment",
                                          "ElementAccessExpression",
                                          "PropertyAccessExpression",
                                          "StringLiteral",
                                          "PropertyAccessExpression",
                                          "Identifier",
                                      ],
                                      type: "literal",
                                      node: "StringLiteral",
                                      value: "#4299e1",
                                      kind: "string",
                                  },
                              ],
                              bg: [
                                  {
                                      stack: [
                                          "CallExpression",
                                          "ObjectLiteralExpression",
                                          "PropertyAssignment",
                                          "ObjectLiteralExpression",
                                          "PropertyAssignment",
                                          "ElementAccessExpression",
                                          "Identifier",
                                          "StringLiteral",
                                      ],
                                      type: "literal",
                                      node: "Identifier",
                                      value: "#39539b",
                                      kind: "string",
                                  },
                              ],
                              bgSecondary: [
                                  {
                                      stack: [
                                          "CallExpression",
                                          "ObjectLiteralExpression",
                                          "PropertyAssignment",
                                          "ObjectLiteralExpression",
                                          "PropertyAssignment",
                                          "ElementAccessExpression",
                                          "Identifier",
                                          "StringLiteral",
                                      ],
                                      type: "literal",
                                      node: "Identifier",
                                      value: "#6f88cb",
                                      kind: "string",
                                  },
                              ],
                              bgHover: [
                                  {
                                      stack: [
                                          "CallExpression",
                                          "ObjectLiteralExpression",
                                          "PropertyAssignment",
                                          "ObjectLiteralExpression",
                                          "PropertyAssignment",
                                          "ElementAccessExpression",
                                          "Identifier",
                                          "StringLiteral",
                                      ],
                                      type: "literal",
                                      node: "Identifier",
                                      value: "#a7b6df",
                                      kind: "string",
                                  },
                              ],
                          },
                      },
                  ],
              },
          ],
      ]
    `)
})
