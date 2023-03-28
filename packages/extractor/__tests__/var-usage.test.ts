import { ts } from 'ts-morph'
import { expect, it } from 'vitest'
import { extractFunctionFrom } from '../src/extract-function-from'
import type { BoxNodeLiteral, BoxNodeMap } from '../src/type-factory'
import { unbox } from '../src/unbox'
import { createProject } from './createProject'

const project = createProject()

it('can find usage references from a variable', () => {
  const code = `
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
            // "error": "var(--backgroundColor-error__1dghp00s)",
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
            // borderRadius: coreThemeVars.space,
            // color: coreThemeVars.color,
        },
    });
    `

  const sourceFile = project.createSourceFile('var-usage.ts', code, { scriptKind: ts.ScriptKind.TSX })
  const extracted = extractFunctionFrom(
    sourceFile,
    'defineProperties',
    (boxNode) => unbox(boxNode.value[0] as BoxNodeMap),
    {
      importName: '@box-extractor/vanilla-wind',
    },
  )
  const sprinklesFn = extracted.get('sprinklesFn')!

  const properties = (sprinklesFn.queryBox.value[0]! as BoxNodeMap).value.get('properties')! as BoxNodeMap
  const backgroundColor = properties.value.get('backgroundColor')! as BoxNodeMap
  const warning = backgroundColor.value.get('warning')! as BoxNodeLiteral

  expect(warning.getNode().getText()).toMatchInlineSnapshot('"\\"var(--backgroundColor-warning__1dghp00t)\\""')
  expect(warning).toMatchInlineSnapshot(`
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
    }
  `)
})
