import { expect, it, test } from 'vitest'
import { BoxNode, BoxNodeMap } from '../src/type-factory'
import { ExtractedFunctionResult } from '../src/types'
import { unbox } from '../src/unbox'
import { visitBoxNode } from '../src/visitBoxNode'
import { createProject, getTestExtract, TestExtractOptions } from './createProject'

const project = createProject()
const getExtract = (code: string, options: TestExtractOptions) => getTestExtract(project, code, options)

it('can visit box node', () => {
  const extracted = getExtract(
    `
    import { createTheme, defineProperties } from "@box-extractor/vanilla-wind";

    export const [coreThemeClass,coreThemeVars] = ["_1dghp000", {
        "backgroundColor": {
            "warning": "var(--backgroundColor-warning__1dghp00t)"
        },
    }];

    export const sprinklesFn = defineProperties({
        properties: {
            display: true,
            backgroundColor: coreThemeVars.backgroundColor,
        },
    });
    `,
    { functionNameList: ['defineProperties'] },
  )
  const defineProperties = extracted.get('defineProperties')!
  const properties = (defineProperties as ExtractedFunctionResult).queryList[0].box

  const visiteds = new Set<BoxNode>()
  visitBoxNode(properties, (node, _key, _parent, traversal) => {
    if (visiteds.has(node)) {
      traversal.skip()
      return
    }

    visiteds.add(node)
  })

  expect(visiteds).toMatchInlineSnapshot(`
      [
          {
              stack: ["CallExpression", "ObjectLiteralExpression"],
              type: "map",
              node: "CallExpression",
              value: {
                  properties: {
                      stack: ["CallExpression", "ObjectLiteralExpression", "PropertyAssignment", "ObjectLiteralExpression"],
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
              },
          },
          {
              stack: ["CallExpression", "ObjectLiteralExpression", "PropertyAssignment", "ObjectLiteralExpression"],
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
          {
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
          {
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
          {
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
      ]
    `)
})

it('can unbox literal', () => {
  const extracted = getExtract(
    `
        import { createTheme, defineProperties } from "@box-extractor/vanilla-wind";

        export const [coreThemeClass,coreThemeVars] = ["_1dghp000", {
            "space": {
                "none": "var(--space-none__1dghp001)",
                "px": "var(--space-px__1dghp002)",
                "xsm": "var(--space-xsm__1dghp003)",
                "small": "var(--space-small__1dghp004)",
            },
            "size": {
                "none": "var(--size-none__1dghp00c)",
                "px": "var(--size-px__1dghp00d)",
                "1/2": "var(--size-1\\/2__1dghp00e)",
                "1/3": "var(--size-1\\/3__1dghp00f)",
                "2/3": "var(--size-2\\/3__1dghp00g)",
            },
            "transition": {
                "fast": "var(--transition-fast__1dghp00q)",
                "slow": "var(--transition-slow__1dghp00r)"
            },
            "backgroundColor": {
                "error": "var(--backgroundColor-error__1dghp00s)",
                "warning": "var(--backgroundColor-warning__1dghp00t)"
            },
            "color": {
                "white": "var(--color-white__1dghp00u)",
                "black": "var(--color-black__1dghp00v)",
                "error": "var(--color-error__1dghp00w)",
                "warning": "var(--color-warning__1dghp00x)"
            }
        }];

        export const sprinklesFn = defineProperties({
            properties: {
                display: true,
                backgroundColor: coreThemeVars.backgroundColor,
                borderRadius: coreThemeVars.space,
                color: coreThemeVars.color,
            },
        });
    `,
    { functionNameList: ['defineProperties'] },
  )
  const defineProperties = extracted.get('defineProperties')!
  const argsList = (defineProperties as ExtractedFunctionResult).queryList[0].box
  const objectArg = argsList.value[0] as BoxNodeMap

  expect(unbox(objectArg)).toMatchInlineSnapshot(`
      {
          properties: {
              display: true,
              backgroundColor: {
                  error: "var(--backgroundColor-error__1dghp00s)",
                  warning: "var(--backgroundColor-warning__1dghp00t)",
              },
              borderRadius: {
                  none: "var(--space-none__1dghp001)",
                  px: "var(--space-px__1dghp002)",
                  xsm: "var(--space-xsm__1dghp003)",
                  small: "var(--space-small__1dghp004)",
              },
              color: {
                  white: "var(--color-white__1dghp00u)",
                  black: "var(--color-black__1dghp00v)",
                  error: "var(--color-error__1dghp00w)",
                  warning: "var(--color-warning__1dghp00x)",
              },
          },
      }
    `)
})

test('can unbox #2', () => {
  const codeSample = `
    const coreThemeVars = {
        "space": {
            "none": "var(--space-none__1dghp001)",
            "px": "var(--space-px__1dghp002)",
            "xsm": "var(--space-xsm__1dghp003)",
            "small": "var(--space-small__1dghp004)",
        },
        "size": {
            "none": "var(--size-none__1dghp00c)",
            "px": "var(--size-px__1dghp00d)",
            "1/2": "var(--size-1\\/2__1dghp00e)",
            "1/3": "var(--size-1\\/3__1dghp00f)",
            "2/3": "var(--size-2\\/3__1dghp00g)",
        },
        "transition": {
            "fast": "var(--transition-fast__1dghp00q)",
            "slow": "var(--transition-slow__1dghp00r)"
        },
        "backgroundColor": {
            "error": "var(--backgroundColor-error__1dghp00s)",
            "warning": "var(--backgroundColor-warning__1dghp00t)"
        },
        "color": {
            "white": "var(--color-white__1dghp00u)",
            "black": "var(--color-black__1dghp00v)",
            "error": "var(--color-error__1dghp00w)",
            "warning": "var(--color-warning__1dghp00x)"
        }
    };

    export const properties = defineProperties({
        conditions: {
            mobile: { "@media": "screen and (max-width: 767px)" },
            tablet: { "@media": "screen and (min-width: 768px) and (max-width: 1023px)" },
            desktop: { "@media": "screen and (min-width: 1024px)" },
        },
        properties: {
            display: true,
            flexDirection: true,
            flexGrow: true,
            justifyContent: true,
            alignItems: true,
            position: true,
            backgroundColor: coreThemeVars.backgroundColor,
            borderRadius: coreThemeVars.space,
            gap: coreThemeVars.space,
            width: coreThemeVars.size,
            height: coreThemeVars.size,
            padding: coreThemeVars.space,
            margin: coreThemeVars.space,
            paddingTop: coreThemeVars.space,
            paddingBottom: coreThemeVars.space,
            paddingLeft: coreThemeVars.space,
            paddingRight: coreThemeVars.space,
            marginTop: coreThemeVars.space,
            marginBottom: coreThemeVars.space,
            marginLeft: coreThemeVars.space,
            marginRight: coreThemeVars.space,
            transition: coreThemeVars.transition,
            color: coreThemeVars.color,
        },
        shorthands: {
            margin: ["marginTop", "marginRight", "marginBottom", "marginLeft"],
            paddingXY: ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"],
            marginX: ["marginLeft", "marginRight"],
            marginY: ["marginTop", "marginBottom"],
            paddingX: ["paddingLeft", "paddingRight"],
            paddingY: ["paddingTop", "paddingBottom"],
        },
    });
    `

  const extracted = getExtract(codeSample, { functionNameList: ['defineProperties'] })
  const defineProperties = extracted.get('defineProperties')!
  const argsList = (defineProperties as ExtractedFunctionResult).queryList[0].box
  const objectArg = argsList.value[0] as BoxNodeMap

  expect(unbox(objectArg)).toMatchInlineSnapshot(`
      {
          conditions: {
              mobile: {
                  "@media": "screen and (max-width: 767px)",
              },
              tablet: {
                  "@media": "screen and (min-width: 768px) and (max-width: 1023px)",
              },
              desktop: {
                  "@media": "screen and (min-width: 1024px)",
              },
          },
          properties: {
              display: true,
              flexDirection: true,
              flexGrow: true,
              justifyContent: true,
              alignItems: true,
              position: true,
              backgroundColor: {
                  error: "var(--backgroundColor-error__1dghp00s)",
                  warning: "var(--backgroundColor-warning__1dghp00t)",
              },
              borderRadius: {
                  none: "var(--space-none__1dghp001)",
                  px: "var(--space-px__1dghp002)",
                  xsm: "var(--space-xsm__1dghp003)",
                  small: "var(--space-small__1dghp004)",
              },
              gap: {
                  none: "var(--space-none__1dghp001)",
                  px: "var(--space-px__1dghp002)",
                  xsm: "var(--space-xsm__1dghp003)",
                  small: "var(--space-small__1dghp004)",
              },
              width: {
                  none: "var(--size-none__1dghp00c)",
                  px: "var(--size-px__1dghp00d)",
                  "1/2": "var(--size-1/2__1dghp00e)",
                  "1/3": "var(--size-1/3__1dghp00f)",
                  "2/3": "var(--size-2/3__1dghp00g)",
              },
              height: {
                  none: "var(--size-none__1dghp00c)",
                  px: "var(--size-px__1dghp00d)",
                  "1/2": "var(--size-1/2__1dghp00e)",
                  "1/3": "var(--size-1/3__1dghp00f)",
                  "2/3": "var(--size-2/3__1dghp00g)",
              },
              padding: {
                  none: "var(--space-none__1dghp001)",
                  px: "var(--space-px__1dghp002)",
                  xsm: "var(--space-xsm__1dghp003)",
                  small: "var(--space-small__1dghp004)",
              },
              margin: {
                  none: "var(--space-none__1dghp001)",
                  px: "var(--space-px__1dghp002)",
                  xsm: "var(--space-xsm__1dghp003)",
                  small: "var(--space-small__1dghp004)",
              },
              paddingTop: {
                  none: "var(--space-none__1dghp001)",
                  px: "var(--space-px__1dghp002)",
                  xsm: "var(--space-xsm__1dghp003)",
                  small: "var(--space-small__1dghp004)",
              },
              paddingBottom: {
                  none: "var(--space-none__1dghp001)",
                  px: "var(--space-px__1dghp002)",
                  xsm: "var(--space-xsm__1dghp003)",
                  small: "var(--space-small__1dghp004)",
              },
              paddingLeft: {
                  none: "var(--space-none__1dghp001)",
                  px: "var(--space-px__1dghp002)",
                  xsm: "var(--space-xsm__1dghp003)",
                  small: "var(--space-small__1dghp004)",
              },
              paddingRight: {
                  none: "var(--space-none__1dghp001)",
                  px: "var(--space-px__1dghp002)",
                  xsm: "var(--space-xsm__1dghp003)",
                  small: "var(--space-small__1dghp004)",
              },
              marginTop: {
                  none: "var(--space-none__1dghp001)",
                  px: "var(--space-px__1dghp002)",
                  xsm: "var(--space-xsm__1dghp003)",
                  small: "var(--space-small__1dghp004)",
              },
              marginBottom: {
                  none: "var(--space-none__1dghp001)",
                  px: "var(--space-px__1dghp002)",
                  xsm: "var(--space-xsm__1dghp003)",
                  small: "var(--space-small__1dghp004)",
              },
              marginLeft: {
                  none: "var(--space-none__1dghp001)",
                  px: "var(--space-px__1dghp002)",
                  xsm: "var(--space-xsm__1dghp003)",
                  small: "var(--space-small__1dghp004)",
              },
              marginRight: {
                  none: "var(--space-none__1dghp001)",
                  px: "var(--space-px__1dghp002)",
                  xsm: "var(--space-xsm__1dghp003)",
                  small: "var(--space-small__1dghp004)",
              },
              transition: {
                  fast: "var(--transition-fast__1dghp00q)",
                  slow: "var(--transition-slow__1dghp00r)",
              },
              color: {
                  white: "var(--color-white__1dghp00u)",
                  black: "var(--color-black__1dghp00v)",
                  error: "var(--color-error__1dghp00w)",
                  warning: "var(--color-warning__1dghp00x)",
              },
          },
          shorthands: {
              margin: ["marginTop", "marginRight", "marginBottom", "marginLeft"],
              paddingXY: ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"],
              marginX: ["marginLeft", "marginRight"],
              marginY: ["marginTop", "marginBottom"],
              paddingX: ["paddingLeft", "paddingRight"],
              paddingY: ["paddingTop", "paddingBottom"],
          },
      }
    `)
})
