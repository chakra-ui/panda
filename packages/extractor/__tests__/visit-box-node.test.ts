import { expect, it, test } from 'vitest'
import { type BoxNode, BoxNodeMap } from '../src/type-factory'
import { type ExtractedFunctionResult } from '../src/types'
import { unbox } from '../src/unbox'
import { visitBoxNode } from '../src/visitBoxNode'
import { createProject, getTestExtract, type TestExtractOptions } from './createProject'

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
    Set {
      BoxNodeMap {
        "node": CallExpression,
        "spreadConditions": undefined,
        "stack": [
          CallExpression,
          ObjectLiteralExpression,
        ],
        "type": "map",
        "value": Map {
          "properties" => BoxNodeMap {
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
              "display" => BoxNodeLiteral {
                "kind": "boolean",
                "node": TrueKeyword,
                "stack": [
                  CallExpression,
                  ObjectLiteralExpression,
                  PropertyAssignment,
                  ObjectLiteralExpression,
                  PropertyAssignment,
                  TrueKeyword,
                ],
                "type": "literal",
                "value": true,
              },
              "backgroundColor" => BoxNodeMap {
                "node": ObjectLiteralExpression,
                "spreadConditions": undefined,
                "stack": [
                  CallExpression,
                  ObjectLiteralExpression,
                  PropertyAssignment,
                  ObjectLiteralExpression,
                  PropertyAssignment,
                  PropertyAccessExpression,
                  Identifier,
                  Identifier,
                  BindingElement,
                  ArrayLiteralExpression,
                  ObjectLiteralExpression,
                  PropertyAssignment,
                  ObjectLiteralExpression,
                ],
                "type": "map",
                "value": Map {
                  "warning" => BoxNodeLiteral {
                    "kind": "string",
                    "node": StringLiteral,
                    "stack": [
                      CallExpression,
                      ObjectLiteralExpression,
                      PropertyAssignment,
                      ObjectLiteralExpression,
                      PropertyAssignment,
                      PropertyAccessExpression,
                      Identifier,
                      Identifier,
                      BindingElement,
                      ArrayLiteralExpression,
                      ObjectLiteralExpression,
                      PropertyAssignment,
                      ObjectLiteralExpression,
                      PropertyAssignment,
                      StringLiteral,
                    ],
                    "type": "literal",
                    "value": "var(--backgroundColor-warning__1dghp00t)",
                  },
                },
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
          ObjectLiteralExpression,
        ],
        "type": "map",
        "value": Map {
          "display" => BoxNodeLiteral {
            "kind": "boolean",
            "node": TrueKeyword,
            "stack": [
              CallExpression,
              ObjectLiteralExpression,
              PropertyAssignment,
              ObjectLiteralExpression,
              PropertyAssignment,
              TrueKeyword,
            ],
            "type": "literal",
            "value": true,
          },
          "backgroundColor" => BoxNodeMap {
            "node": ObjectLiteralExpression,
            "spreadConditions": undefined,
            "stack": [
              CallExpression,
              ObjectLiteralExpression,
              PropertyAssignment,
              ObjectLiteralExpression,
              PropertyAssignment,
              PropertyAccessExpression,
              Identifier,
              Identifier,
              BindingElement,
              ArrayLiteralExpression,
              ObjectLiteralExpression,
              PropertyAssignment,
              ObjectLiteralExpression,
            ],
            "type": "map",
            "value": Map {
              "warning" => BoxNodeLiteral {
                "kind": "string",
                "node": StringLiteral,
                "stack": [
                  CallExpression,
                  ObjectLiteralExpression,
                  PropertyAssignment,
                  ObjectLiteralExpression,
                  PropertyAssignment,
                  PropertyAccessExpression,
                  Identifier,
                  Identifier,
                  BindingElement,
                  ArrayLiteralExpression,
                  ObjectLiteralExpression,
                  PropertyAssignment,
                  ObjectLiteralExpression,
                  PropertyAssignment,
                  StringLiteral,
                ],
                "type": "literal",
                "value": "var(--backgroundColor-warning__1dghp00t)",
              },
            },
          },
        },
      },
      BoxNodeLiteral {
        "kind": "boolean",
        "node": TrueKeyword,
        "stack": [
          CallExpression,
          ObjectLiteralExpression,
          PropertyAssignment,
          ObjectLiteralExpression,
          PropertyAssignment,
          TrueKeyword,
        ],
        "type": "literal",
        "value": true,
      },
      BoxNodeMap {
        "node": ObjectLiteralExpression,
        "spreadConditions": undefined,
        "stack": [
          CallExpression,
          ObjectLiteralExpression,
          PropertyAssignment,
          ObjectLiteralExpression,
          PropertyAssignment,
          PropertyAccessExpression,
          Identifier,
          Identifier,
          BindingElement,
          ArrayLiteralExpression,
          ObjectLiteralExpression,
          PropertyAssignment,
          ObjectLiteralExpression,
        ],
        "type": "map",
        "value": Map {
          "warning" => BoxNodeLiteral {
            "kind": "string",
            "node": StringLiteral,
            "stack": [
              CallExpression,
              ObjectLiteralExpression,
              PropertyAssignment,
              ObjectLiteralExpression,
              PropertyAssignment,
              PropertyAccessExpression,
              Identifier,
              Identifier,
              BindingElement,
              ArrayLiteralExpression,
              ObjectLiteralExpression,
              PropertyAssignment,
              ObjectLiteralExpression,
              PropertyAssignment,
              StringLiteral,
            ],
            "type": "literal",
            "value": "var(--backgroundColor-warning__1dghp00t)",
          },
        },
      },
      BoxNodeLiteral {
        "kind": "string",
        "node": StringLiteral,
        "stack": [
          CallExpression,
          ObjectLiteralExpression,
          PropertyAssignment,
          ObjectLiteralExpression,
          PropertyAssignment,
          PropertyAccessExpression,
          Identifier,
          Identifier,
          BindingElement,
          ArrayLiteralExpression,
          ObjectLiteralExpression,
          PropertyAssignment,
          ObjectLiteralExpression,
          PropertyAssignment,
          StringLiteral,
        ],
        "type": "literal",
        "value": "var(--backgroundColor-warning__1dghp00t)",
      },
    }
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
      "properties": {
        "backgroundColor": {
          "error": "var(--backgroundColor-error__1dghp00s)",
          "warning": "var(--backgroundColor-warning__1dghp00t)",
        },
        "borderRadius": {
          "none": "var(--space-none__1dghp001)",
          "px": "var(--space-px__1dghp002)",
          "small": "var(--space-small__1dghp004)",
          "xsm": "var(--space-xsm__1dghp003)",
        },
        "color": {
          "black": "var(--color-black__1dghp00v)",
          "error": "var(--color-error__1dghp00w)",
          "warning": "var(--color-warning__1dghp00x)",
          "white": "var(--color-white__1dghp00u)",
        },
        "display": true,
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
      "conditions": {
        "desktop": {
          "@media": "screen and (min-width: 1024px)",
        },
        "mobile": {
          "@media": "screen and (max-width: 767px)",
        },
        "tablet": {
          "@media": "screen and (min-width: 768px) and (max-width: 1023px)",
        },
      },
      "properties": {
        "alignItems": true,
        "backgroundColor": {
          "error": "var(--backgroundColor-error__1dghp00s)",
          "warning": "var(--backgroundColor-warning__1dghp00t)",
        },
        "borderRadius": {
          "none": "var(--space-none__1dghp001)",
          "px": "var(--space-px__1dghp002)",
          "small": "var(--space-small__1dghp004)",
          "xsm": "var(--space-xsm__1dghp003)",
        },
        "color": {
          "black": "var(--color-black__1dghp00v)",
          "error": "var(--color-error__1dghp00w)",
          "warning": "var(--color-warning__1dghp00x)",
          "white": "var(--color-white__1dghp00u)",
        },
        "display": true,
        "flexDirection": true,
        "flexGrow": true,
        "gap": {
          "none": "var(--space-none__1dghp001)",
          "px": "var(--space-px__1dghp002)",
          "small": "var(--space-small__1dghp004)",
          "xsm": "var(--space-xsm__1dghp003)",
        },
        "height": {
          "1/2": "var(--size-1/2__1dghp00e)",
          "1/3": "var(--size-1/3__1dghp00f)",
          "2/3": "var(--size-2/3__1dghp00g)",
          "none": "var(--size-none__1dghp00c)",
          "px": "var(--size-px__1dghp00d)",
        },
        "justifyContent": true,
        "margin": {
          "none": "var(--space-none__1dghp001)",
          "px": "var(--space-px__1dghp002)",
          "small": "var(--space-small__1dghp004)",
          "xsm": "var(--space-xsm__1dghp003)",
        },
        "marginBottom": {
          "none": "var(--space-none__1dghp001)",
          "px": "var(--space-px__1dghp002)",
          "small": "var(--space-small__1dghp004)",
          "xsm": "var(--space-xsm__1dghp003)",
        },
        "marginLeft": {
          "none": "var(--space-none__1dghp001)",
          "px": "var(--space-px__1dghp002)",
          "small": "var(--space-small__1dghp004)",
          "xsm": "var(--space-xsm__1dghp003)",
        },
        "marginRight": {
          "none": "var(--space-none__1dghp001)",
          "px": "var(--space-px__1dghp002)",
          "small": "var(--space-small__1dghp004)",
          "xsm": "var(--space-xsm__1dghp003)",
        },
        "marginTop": {
          "none": "var(--space-none__1dghp001)",
          "px": "var(--space-px__1dghp002)",
          "small": "var(--space-small__1dghp004)",
          "xsm": "var(--space-xsm__1dghp003)",
        },
        "padding": {
          "none": "var(--space-none__1dghp001)",
          "px": "var(--space-px__1dghp002)",
          "small": "var(--space-small__1dghp004)",
          "xsm": "var(--space-xsm__1dghp003)",
        },
        "paddingBottom": {
          "none": "var(--space-none__1dghp001)",
          "px": "var(--space-px__1dghp002)",
          "small": "var(--space-small__1dghp004)",
          "xsm": "var(--space-xsm__1dghp003)",
        },
        "paddingLeft": {
          "none": "var(--space-none__1dghp001)",
          "px": "var(--space-px__1dghp002)",
          "small": "var(--space-small__1dghp004)",
          "xsm": "var(--space-xsm__1dghp003)",
        },
        "paddingRight": {
          "none": "var(--space-none__1dghp001)",
          "px": "var(--space-px__1dghp002)",
          "small": "var(--space-small__1dghp004)",
          "xsm": "var(--space-xsm__1dghp003)",
        },
        "paddingTop": {
          "none": "var(--space-none__1dghp001)",
          "px": "var(--space-px__1dghp002)",
          "small": "var(--space-small__1dghp004)",
          "xsm": "var(--space-xsm__1dghp003)",
        },
        "position": true,
        "transition": {
          "fast": "var(--transition-fast__1dghp00q)",
          "slow": "var(--transition-slow__1dghp00r)",
        },
        "width": {
          "1/2": "var(--size-1/2__1dghp00e)",
          "1/3": "var(--size-1/3__1dghp00f)",
          "2/3": "var(--size-2/3__1dghp00g)",
          "none": "var(--size-none__1dghp00c)",
          "px": "var(--size-px__1dghp00d)",
        },
      },
      "shorthands": {
        "margin": [
          "marginTop",
          "marginRight",
          "marginBottom",
          "marginLeft",
        ],
        "marginX": [
          "marginLeft",
          "marginRight",
        ],
        "marginY": [
          "marginTop",
          "marginBottom",
        ],
        "paddingX": [
          "paddingLeft",
          "paddingRight",
        ],
        "paddingXY": [
          "paddingTop",
          "paddingRight",
          "paddingBottom",
          "paddingLeft",
        ],
        "paddingY": [
          "paddingTop",
          "paddingBottom",
        ],
      },
    }
  `)
})
