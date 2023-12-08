import { SourceFile } from 'ts-morph'
import { afterEach, expect, it } from 'vitest'
import type { ComponentMatchers, ExtractOptions } from '../src/types'
import { createProject, getTestExtract } from './create-project'
import { unbox } from '../src/unbox'
// @ts-ignore
import { default as ExtractSample } from './samples/ExtractSample?raw'

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

const componentsMatcher: ComponentMatchers = {
  matchTag: ({ tagName }) => Boolean(config[tagName]),
  matchProp: ({ tagName, propName }) => config[tagName]?.includes(propName),
}

type TestExtractOptions = Omit<ExtractOptions, 'ast'> & { tagNameList?: string[]; functionNameList?: string[] }
const getExtract = (code: string, options: TestExtractOptions) => getTestExtract(project, code, options)

const extractFromCode = (code: string, options?: TestExtractOptions) => {
  const extracted = getExtract(code, { components: componentsMatcher, ...options })
  const entries = Array.from(extracted.entries()).map(([name]) => [
    name,
    extracted.get(name)!.queryList.map((query) => unbox(query.box)),
  ])
  return Object.fromEntries(entries)
}

it('extract it all', () => {
  expect(extractFromCode(ExtractSample)).toMatchInlineSnapshot(`
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "red.200",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "backgroundColor": "blackAlpha.100",
            "color": "yellow.300",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [
            {
              "color": "cyan.400",
            },
            {
              "color": "cyan.500",
            },
          ],
          "raw": {},
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "color": "facebook.400",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "color": "gray.100",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "color": "facebook.500",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [
            {
              "color": "facebook.600",
            },
            {
              "color": "gray.200",
            },
          ],
          "raw": {},
          "spreadConditions": [],
        },
        {
          "conditions": [
            {
              "color": "gray.200",
            },
            {
              "color": "gray.300",
            },
          ],
          "raw": {},
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "color": "gray.100",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "color": "facebook.900",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "color": "facebook.900",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "color": "pink.100",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "color": "pink.100",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "color": "pink.100",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "color": "pink.100",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "color": "pink.100",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "color": "facebook.900",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "color": "facebook.900",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "color": "facebook.900",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "color": "gray.100",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "color": "gray.100",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "color": "gray.100",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "color": "gray.100",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "color": "gray.100",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "color": "gray.100",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "color": "gray.100",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "color": "gray.100",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "color": "gray.100",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "color": "gray.100",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "color": "gray.100",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [
            {
              "color": "gray.600",
            },
            {
              "color": "gray.800",
            },
          ],
          "raw": {},
          "spreadConditions": [],
        },
        {
          "conditions": [
            {
              "color": "gray.700",
            },
            {
              "color": "gray.100",
            },
          ],
          "raw": {},
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "color": "gray.100",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "color": "facebook.100",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "color": "blackAlpha.400",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {},
          "spreadConditions": [
            {
              "color": "blackAlpha.400",
            },
          ],
        },
        {
          "conditions": [],
          "raw": {
            "backgroundColor": "blackAlpha.100",
            "color": "facebook.200",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {},
          "spreadConditions": [
            {
              "color": "facebook.200",
            },
          ],
        },
        {
          "conditions": [],
          "raw": {},
          "spreadConditions": [
            {
              "color": "facebook.300",
            },
          ],
        },
        {
          "conditions": [],
          "raw": {
            "backgroundColor": "twitter.200",
            "color": "twitter.100",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "backgroundColor": "twitter.200",
            "color": "orange.100",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "color": "orange.200",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "color": "orange.400",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "backgroundColor": "telegram.400",
            "color": "telegram.300",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "color": {
              "default": "red.100",
              "focus": "blue.100",
              "hover": "green.100",
            },
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "backgroundColor": {
              "default": "orange.800",
              "focus": "yellow.700",
              "hover": "telegram.200",
            },
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "color": "facebook.900",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "color": "facebook.900",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "color": "facebook.900",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "color": "red.100",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "color": "red.100",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "color": "green.100",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "color": "blue.100",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "color": "yellow.100",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "color": "orange.100",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "color": "orange.300",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "color": "red.100",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "color": "orange.400",
          },
          "spreadConditions": [],
        },
      ],
    }
  `)
})

it('extract JsxAttribute > StringLiteral (multiple)', () => {
  expect(extractFromCode(`<ColorBox color="red.200" backgroundColor="blackAlpha.100"></ColorBox>`))
    .toMatchInlineSnapshot(`
      {
        "ColorBox": [
          {
            "conditions": [],
            "raw": {
              "backgroundColor": "blackAlpha.100",
              "color": "red.200",
            },
            "spreadConditions": [],
          },
        ],
      }
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
        "box": {
          "column": 5,
          "line": 2,
          "node": "JsxSelfClosingElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 21,
              "line": 2,
              "node": "StringLiteral",
              "type": "literal",
              "value": "red.200",
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 5,
          "line": 3,
          "node": "JsxSelfClosingElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 97,
              "line": 3,
              "node": "StringLiteral",
              "type": "literal",
              "value": "blue.100",
            },
            "backgroundColor" => {
              "column": 50,
              "line": 3,
              "node": "StringLiteral",
              "type": "literal",
              "value": "blackAlpha.100",
            },
            "display" => {
              "column": 82,
              "line": 3,
              "node": "StringLiteral",
              "type": "literal",
              "value": "flex",
            },
          },
        },
        "name": "ColorBox",
      },
    ]
  `)
})

it('ExtractSample - groups extract props in parent component instance', () => {
  const extracted = getExtract(ExtractSample, { tagNameList: ['ColorBox'] })
  expect(extracted.get('ColorBox')!.queryList).toMatchInlineSnapshot(`
    [
      {
        "box": {
          "column": 11,
          "line": 72,
          "node": "JsxSelfClosingElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 27,
              "line": 72,
              "node": "StringLiteral",
              "type": "literal",
              "value": "red.200",
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 11,
          "line": 75,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 27,
              "line": 75,
              "node": "StringLiteral",
              "type": "literal",
              "value": "yellow.300",
            },
            "backgroundColor" => {
              "column": 56,
              "line": 75,
              "node": "StringLiteral",
              "type": "literal",
              "value": "blackAlpha.100",
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 11,
          "line": 78,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 28,
              "line": 78,
              "node": "ConditionalExpression",
              "type": "conditional",
              "value": undefined,
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 11,
          "line": 79,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 28,
              "line": 79,
              "node": "StringLiteral",
              "type": "literal",
              "value": "facebook.400",
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 11,
          "line": 80,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 21,
              "line": 6,
              "node": "StringLiteral",
              "type": "literal",
              "value": "gray.100",
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 11,
          "line": 81,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 38,
              "line": 81,
              "node": "StringLiteral",
              "type": "literal",
              "value": "facebook.500",
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 11,
          "line": 82,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 28,
              "line": 82,
              "node": "ConditionalExpression",
              "type": "conditional",
              "value": undefined,
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 11,
          "line": 84,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 28,
              "line": 84,
              "node": "ConditionalExpression",
              "type": "conditional",
              "value": undefined,
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 11,
          "line": 86,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 21,
              "line": 6,
              "node": "StringLiteral",
              "type": "literal",
              "value": "gray.100",
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 11,
          "line": 87,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 43,
              "line": 87,
              "node": "StringLiteral",
              "type": "literal",
              "value": "facebook.900",
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 11,
          "line": 88,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 29,
              "line": 88,
              "node": "StringLiteral",
              "type": "literal",
              "value": "facebook.900",
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 11,
          "line": 89,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 16,
              "line": 45,
              "node": "StringLiteral",
              "type": "literal",
              "value": "pink.100",
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 11,
          "line": 90,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 16,
              "line": 45,
              "node": "StringLiteral",
              "type": "literal",
              "value": "pink.100",
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 11,
          "line": 91,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 16,
              "line": 45,
              "node": "StringLiteral",
              "type": "literal",
              "value": "pink.100",
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 11,
          "line": 92,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 16,
              "line": 45,
              "node": "StringLiteral",
              "type": "literal",
              "value": "pink.100",
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 11,
          "line": 93,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 16,
              "line": 45,
              "node": "StringLiteral",
              "type": "literal",
              "value": "pink.100",
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 11,
          "line": 94,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 44,
              "line": 94,
              "node": "StringLiteral",
              "type": "literal",
              "value": "facebook.900",
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 11,
          "line": 95,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 44,
              "line": 95,
              "node": "StringLiteral",
              "type": "literal",
              "value": "facebook.900",
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 11,
          "line": 96,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 45,
              "line": 96,
              "node": "StringLiteral",
              "type": "literal",
              "value": "facebook.900",
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 11,
          "line": 97,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 21,
              "line": 6,
              "node": "StringLiteral",
              "type": "literal",
              "value": "gray.100",
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 11,
          "line": 98,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 21,
              "line": 6,
              "node": "StringLiteral",
              "type": "literal",
              "value": "gray.100",
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 11,
          "line": 101,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 21,
              "line": 6,
              "node": "StringLiteral",
              "type": "literal",
              "value": "gray.100",
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 11,
          "line": 104,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 21,
              "line": 6,
              "node": "StringLiteral",
              "type": "literal",
              "value": "gray.100",
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 11,
          "line": 107,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 21,
              "line": 6,
              "node": "StringLiteral",
              "type": "literal",
              "value": "gray.100",
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 11,
          "line": 110,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 21,
              "line": 6,
              "node": "StringLiteral",
              "type": "literal",
              "value": "gray.100",
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 11,
          "line": 114,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 21,
              "line": 6,
              "node": "StringLiteral",
              "type": "literal",
              "value": "gray.100",
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 11,
          "line": 117,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 21,
              "line": 6,
              "node": "StringLiteral",
              "type": "literal",
              "value": "gray.100",
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 11,
          "line": 121,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 21,
              "line": 6,
              "node": "StringLiteral",
              "type": "literal",
              "value": "gray.100",
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 11,
          "line": 122,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 21,
              "line": 6,
              "node": "StringLiteral",
              "type": "literal",
              "value": "gray.100",
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 11,
          "line": 123,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 21,
              "line": 6,
              "node": "StringLiteral",
              "type": "literal",
              "value": "gray.100",
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 11,
          "line": 125,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 37,
              "line": 125,
              "node": "ConditionalExpression",
              "type": "conditional",
              "value": undefined,
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 11,
          "line": 129,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 29,
              "line": 129,
              "node": "ConditionalExpression",
              "type": "conditional",
              "value": undefined,
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 11,
          "line": 133,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 21,
              "line": 6,
              "node": "StringLiteral",
              "type": "literal",
              "value": "gray.100",
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 11,
          "line": 136,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 34,
              "line": 136,
              "node": "StringLiteral",
              "type": "literal",
              "value": "facebook.100",
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 11,
          "line": 138,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 39,
              "line": 41,
              "node": "StringLiteral",
              "type": "literal",
              "value": "blackAlpha.400",
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 11,
          "line": 140,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {},
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 11,
          "line": 142,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 22,
              "line": 144,
              "node": "StringLiteral",
              "type": "literal",
              "value": "facebook.200",
            },
            "backgroundColor" => {
              "column": 32,
              "line": 145,
              "node": "StringLiteral",
              "type": "literal",
              "value": "blackAlpha.100",
            },
            "borderColor" => {
              "column": 35,
              "line": 146,
              "node": "StringLiteral",
              "type": "literal",
              "value": "blackAlpha.300",
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 11,
          "line": 151,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {},
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 11,
          "line": 152,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {},
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 11,
          "line": 154,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 25,
              "line": 154,
              "node": "CallExpression",
              "type": "literal",
              "value": "twitter.100",
            },
            "backgroundColor" => {
              "column": 25,
              "line": 154,
              "node": "CallExpression",
              "type": "literal",
              "value": "twitter.200",
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 11,
          "line": 156,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {
            "backgroundColor" => {
              "column": 30,
              "line": 156,
              "node": "CallExpression",
              "type": "literal",
              "value": "twitter.200",
            },
            "color" => {
              "column": 55,
              "line": 156,
              "node": "StringLiteral",
              "type": "literal",
              "value": "orange.100",
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 11,
          "line": 158,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 22,
              "line": 161,
              "node": "StringLiteral",
              "type": "literal",
              "value": "orange.200",
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 11,
          "line": 167,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 22,
              "line": 170,
              "node": "StringLiteral",
              "type": "literal",
              "value": "orange.400",
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 11,
          "line": 175,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 22,
              "line": 181,
              "node": "StringLiteral",
              "type": "literal",
              "value": "telegram.300",
            },
            "backgroundColor" => {
              "column": 32,
              "line": 182,
              "node": "StringLiteral",
              "type": "literal",
              "value": "telegram.400",
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 11,
          "line": 189,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 28,
              "line": 189,
              "node": "ObjectLiteralExpression",
              "type": "map",
              "value": Map {
                "default" => {
                  "column": 39,
                  "line": 189,
                  "node": "StringLiteral",
                  "type": "literal",
                  "value": "red.100",
                },
                "hover" => {
                  "column": 57,
                  "line": 189,
                  "node": "StringLiteral",
                  "type": "literal",
                  "value": "green.100",
                },
                "focus" => {
                  "column": 77,
                  "line": 189,
                  "node": "StringLiteral",
                  "type": "literal",
                  "value": "blue.100",
                },
              },
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 11,
          "line": 190,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {
            "backgroundColor" => {
              "column": 38,
              "line": 190,
              "node": "ObjectLiteralExpression",
              "type": "map",
              "value": Map {
                "default" => {
                  "column": 49,
                  "line": 190,
                  "node": "StringLiteral",
                  "type": "literal",
                  "value": "orange.800",
                },
                "hover" => {
                  "column": 70,
                  "line": 190,
                  "node": "StringLiteral",
                  "type": "literal",
                  "value": "telegram.200",
                },
                "focus" => {
                  "column": 93,
                  "line": 190,
                  "node": "StringLiteral",
                  "type": "literal",
                  "value": "yellow.700",
                },
              },
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 5,
          "line": 217,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 32,
              "line": 217,
              "node": "StringLiteral",
              "type": "literal",
              "value": "facebook.900",
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 5,
          "line": 228,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 21,
              "line": 228,
              "node": "StringLiteral",
              "type": "literal",
              "value": "facebook.900",
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 7,
          "line": 229,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 23,
              "line": 229,
              "node": "StringLiteral",
              "type": "literal",
              "value": "facebook.900",
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 5,
          "line": 240,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 21,
              "line": 240,
              "node": "StringLiteral",
              "type": "literal",
              "value": "red.100",
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 7,
          "line": 246,
          "node": "JsxOpeningElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 23,
              "line": 246,
              "node": "StringLiteral",
              "type": "literal",
              "value": "red.100",
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 12,
          "line": 252,
          "node": "JsxSelfClosingElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 28,
              "line": 252,
              "node": "StringLiteral",
              "type": "literal",
              "value": "green.100",
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 12,
          "line": 255,
          "node": "JsxSelfClosingElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 28,
              "line": 255,
              "node": "StringLiteral",
              "type": "literal",
              "value": "blue.100",
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 21,
          "line": 257,
          "node": "JsxSelfClosingElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 37,
              "line": 257,
              "node": "StringLiteral",
              "type": "literal",
              "value": "yellow.100",
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 28,
          "line": 259,
          "node": "JsxSelfClosingElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 44,
              "line": 259,
              "node": "StringLiteral",
              "type": "literal",
              "value": "orange.100",
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 38,
          "line": 260,
          "node": "JsxSelfClosingElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 54,
              "line": 260,
              "node": "StringLiteral",
              "type": "literal",
              "value": "orange.300",
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 73,
          "line": 263,
          "node": "JsxSelfClosingElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 89,
              "line": 263,
              "node": "StringLiteral",
              "type": "literal",
              "value": "red.100",
            },
          },
        },
        "name": "ColorBox",
      },
      {
        "box": {
          "column": 34,
          "line": 264,
          "node": "JsxSelfClosingElement",
          "type": "map",
          "value": Map {
            "color" => {
              "column": 50,
              "line": 264,
              "node": "StringLiteral",
              "type": "literal",
              "value": "orange.400",
            },
          },
        },
        "name": "ColorBox",
      },
    ]
  `)
})

it('extract JsxAttribute > JsxExpression > StringLiteral', () => {
  expect(extractFromCode(`<ColorBox color={"red.300"}></ColorBox>`)).toMatchInlineSnapshot(
    `
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "red.300",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "red.400",
          },
          "spreadConditions": [],
        },
      ],
    }
  `)
})

it('extract JsxAttribute > JsxExpression > ConditonalExpression > Identifier|Value', () => {
  expect(
    extractFromCode(`
            const darkValue = "red.500";
            <ColorBox color={isDark ? darkValue : "whiteAlpha.100"}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
    {
      "ColorBox": [
        {
          "conditions": [
            {
              "color": "red.500",
            },
            {
              "color": "whiteAlpha.100",
            },
          ],
          "raw": {},
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "red.600",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "red.600",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "red.700",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "red.700",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "red.800",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "red.800",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "red.900",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "red.900",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "blue.100",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "blue.100",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "blue.200",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "blue.300",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "blue.300",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "blue.400",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "blue.400",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "blue.500",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "blue.600",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "blue.600",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "blue.700",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "blue.800",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "blue.900",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "green.100",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "green.200",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "green.300",
          },
          "spreadConditions": [],
        },
      ],
    }
  `)
})

it('extract JsxAttribute > JsxExpression > ElementAccessExpression > ObjectLiteralExpression', () => {
  expect(
    extractFromCode(`
            <ColorBox color={{ staticColor: "green.400" }["staticColor"]}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "green.400",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "green.500",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "green.600",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "green.700",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "green.800",
          },
          "spreadConditions": [],
        },
      ],
    }
  `)
})

it('extract JsxAttribute > JsxExpression > ElementAccessExpression > ArrayLiteralExpression > NumericLiteral', () => {
  expect(
    extractFromCode(`
            <ColorBox color={["green.900"][0]}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "green.900",
          },
          "spreadConditions": [],
        },
      ],
    }
  `)
})

it('extract JsxAttribute > JsxExpression > ElementAccessExpression > ArrayLiteralExpression > StringLiteral', () => {
  expect(
    extractFromCode(`
            <ColorBox color={["pink.100"]["0"]}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "pink.100",
          },
          "spreadConditions": [],
        },
      ],
    }
  `)
})

it('extract JsxAttribute > JsxExpression > ElementAccessExpression > ArrayLiteralExpression > Identifier > NumericLiteral', () => {
  expect(
    extractFromCode(`
            const nbIndex = 1;
            <ColorBox color={["pink.100", "pink.200"][nbIndex]}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "pink.200",
          },
          "spreadConditions": [],
        },
      ],
    }
  `)
})

it('extract JsxAttribute > JsxExpression > ElementAccessExpression > ArrayLiteralExpression > Identifier > StringLiteral', () => {
  expect(
    extractFromCode(`
            const strIndex = "0";
            <ColorBox color={["pink.300"][strIndex]}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "pink.300",
          },
          "spreadConditions": [],
        },
      ],
    }
  `)
})

it('extract JsxAttribute > JsxExpression > ElementAccessExpression > ParenthesizedExpression > AsExpression > NumericLiteral', () => {
  expect(
    extractFromCode(`
            const array = ["pink.400"];
            <ColorBox color={(array as any)?.[0] as any}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "pink.400",
          },
          "spreadConditions": [],
        },
      ],
    }
  `)
})

it('extract JsxAttribute > JsxExpression > ArrayLiteralExpression > ElementAccessExpression > NonNullExpression > ElementAccessExpression > NumericLiteral', () => {
  expect(
    extractFromCode(`
            const array = ["pink.500"];
            <ColorBox color={[array[0]]![0]}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "pink.500",
          },
          "spreadConditions": [],
        },
      ],
    }
  `)
})

it('extract JsxAttribute > JsxExpression > ElementAccessExpression > ElementAccessExpression > ArrayLiteralExpression > ObjectLiteralExpresssion > PropertyAssignment > StringLiteral', () => {
  expect(
    extractFromCode(`
            <ColorBox color={[{ staticColor: "pink.600" }][0]["staticColor"]}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "pink.600",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "pink.800",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "pink.900",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "pink.900",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "yellow.100",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "yellow.200",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "yellow.500",
          },
          "spreadConditions": [],
        },
      ],
    }
  `)
})

it('extract JsxAttribute > JsxExpression > CallExpression > ArrowFunction > Identifier (StringLiteral)', () => {
  expect(
    extractFromCode(`
            const getColor = () => "yellow.600";

            <ColorBox color={getColor()}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "yellow.600",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "yellow.700",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "yellow.900",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {},
          "spreadConditions": [],
        },
      ],
    }
  `)
})

it('extract JsxAttribute > JsxExpression > ConditionalExpression > BinaryExpression > StringLiteral', () => {
  expect(
    extractFromCode(`
            <ColorBox color={(1 + 1) === 2 ? "purple.100" : "purple.never2"}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "purple.100",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "purple.200",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "purple.300",
          },
          "spreadConditions": [],
        },
      ],
    }
  `)
})

it('extract JsxAttribute > JsxExpression > BinaryExpression > StringLiteral', () => {
  expect(
    extractFromCode(`
            const dot = ".";
            <ColorBox color={"purple" + dot + "400"}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "purple.400",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "purple.500",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [
            {
              "color": "purple.600",
            },
            {
              "color": "purple.700",
            },
          ],
          "raw": {},
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [
            {
              "color": "purple.900",
            },
            {
              "color": "purple.950",
            },
          ],
          "raw": {},
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [
            {
              "color": "orange.200",
            },
            {
              "color": "orange.300",
            },
          ],
          "raw": {},
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "orange.400",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "orange.500",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "orange.600",
          },
          "spreadConditions": [],
        },
      ],
    }
  `)
})

it('extract JsxSpreadAttribute > ObjectLiteralExpression', () => {
  expect(
    extractFromCode(`
            <ColorBox {...{ color: "orange.700" }}>spread</ColorBox>
        `),
  ).toMatchInlineSnapshot(`
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "orange.700",
          },
          "spreadConditions": [],
        },
      ],
    }
  `)
})

it('extract JsxSpreadAttribute > ObjectLiteralExpression with allowed properties list', () => {
  expect(
    extractFromCode(`
            <ColorBox {...{ color: "orange.725", flexDirection: "flex", ...{ backgroundColor: "orange.750", justifyContent: "center" } }}>spread</ColorBox>
        `),
  ).toMatchInlineSnapshot(`
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "backgroundColor": "orange.750",
            "color": "orange.725",
          },
          "spreadConditions": [],
        },
      ],
    }
  `)
})

it('extract JsxSpreadAttribute > Identifier > ObjectLiteralExpression', () => {
  expect(
    extractFromCode(`
            const objectWithAttributes = { color: "orange.800" } as any;
            <ColorBox {...objectWithAttributes}>var spread</ColorBox>
        `),
  ).toMatchInlineSnapshot(`
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "orange.800",
          },
          "spreadConditions": [],
        },
      ],
    }
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
  ).toMatchInlineSnapshot(`
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {},
          "spreadConditions": [],
        },
      ],
    }
  `)
})

it('extract JsxSpreadAttribute > ConditionalExpression > Identifier/NullKeyword > truthy', () => {
  expect(
    extractFromCode(`
            const isShown = true;
            const objectWithAttributes = { color: "orange.900" } as any;
            <ColorBox {...(isShown ? objectWithAttributes : null)}>conditional var spread</ColorBox>
        `),
  ).toMatchInlineSnapshot(`
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "orange.900",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "backgroundColor": "teal.200",
            "color": "teal.100",
          },
          "spreadConditions": [],
        },
      ],
    }
  `)
})

it('extract JsxSpreadAttribute > ConditionalExpression > ObjectLiteralExpression/Identifier', () => {
  expect(
    extractFromCode(`
            <ColorBox {...(true ? ({ color: "teal.400" }) as any : (undefined) as unknown)}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "teal.400",
          },
          "spreadConditions": [],
        },
      ],
    }
  `)
})

it('extract JsxSpreadAttribute > BinaryExpression > AmpersandAmpersandToken / ObjectLiteralExpression', () => {
  expect(
    extractFromCode(`
            <ColorBox {...(true && ({ color: "teal.500" }))}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "teal.500",
          },
          "spreadConditions": [],
        },
      ],
    }
  `)
})

it('extract JsxSpreadAttribute > CallExpression', () => {
  expect(
    extractFromCode(`
            const getColorConfig = () => ({ color: "teal.600", backgroundColor: "teal.650" });
            <ColorBox {...getColorConfig()}>spread fn result</ColorBox>
        `),
  ).toMatchInlineSnapshot(`
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "backgroundColor": "teal.650",
            "color": "teal.600",
          },
          "spreadConditions": [],
        },
      ],
    }
  `)
})

it('extract JsxSpreadAttribute > CallExpression with allowed properties list', () => {
  expect(
    extractFromCode(`
            const getColorConfig = () => ({ color: "teal.625", backgroundColor: "teal.675", flexDirection: "flex", ...{ backgroundColor: "teal.699", justifyContent: "center" } });
            <ColorBox {...getColorConfig()}>spread fn result</ColorBox>
        `),
  ).toMatchInlineSnapshot(`
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "backgroundColor": "teal.699",
            "color": "teal.625",
          },
          "spreadConditions": [],
        },
      ],
    }
  `)
})

it('extract JsxSpreadAttribute > ObjectLiteralExpression > SpreadAssignment > CallExpression', () => {
  expect(
    extractFromCode(`
            const getColorConfig = () => ({ color: "never.700", backgroundColor: "teal.800" });
            <ColorBox {...{ ...getColorConfig(), color: "teal.700" }}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "backgroundColor": "teal.800",
            "color": "teal.700",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "backgroundColor": "cyan.100",
            "color": "cyan.200",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "backgroundColor": "cyan.300",
            "color": "cyan.400",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "backgroundColor": "cyan.600",
            "color": "cyan.500",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {},
          "spreadConditions": [
            {
              "color": "cyan.700",
            },
            {
              "backgroundColor": "cyan.800",
            },
          ],
        },
      ],
    }
  `)
})

it('extract JsxSpreadAttribute > ElementAccessExpression', () => {
  expect(
    extractFromCode(`
            const objectWithAttributes = { color: "cyan.900" } as any;
            const themeObjectsMap = {
                basic: objectWithAttributes,
            };
            <ColorBox color="never.000" {...themeObjectsMap[\`basic\`]}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "cyan.900",
          },
          "spreadConditions": [],
        },
      ],
    }
  `)
})

it('extract JsxSpreadAttribute > PropertyAccessExpression', () => {
  expect(
    extractFromCode(`
            const objectWithAttributes = { color: "salmon.100" } as any;
            const themeObjectsMap = {
                basic: objectWithAttributes,
            };
            <ColorBox color="never.111" {...themeObjectsMap.basic}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "salmon.100",
          },
          "spreadConditions": [],
        },
      ],
    }
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
            <ColorBox color="never.222" {...themeObjectsMap.basic.nested}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "salmon.200",
          },
          "spreadConditions": [],
        },
      ],
    }
  `)
})

it('extract JsxSpreadAttribute > ElementAccessExpression + PropertyAccessExpression', () => {
  expect(
    extractFromCode(`
            const objectWithAttributes = { color: "salmon.300" } as any;
            const themeObjectsMap = {
                basic: { nested: objectWithAttributes },
            };
            <ColorBox color="never.333" {...themeObjectsMap[\`basic\`].nested}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "salmon.300",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "salmon.400",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "salmon.500",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "salmon.600",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "salmon.700",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "salmon.800",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {},
          "spreadConditions": [
            {
              "color": "salmon.850",
            },
            {
              "color": "salmon.900",
            },
          ],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "white.100",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "white.200",
          },
          "spreadConditions": [],
        },
      ],
    }
  `)
})

it('extract JsxAttribute > JsxExpression  > NumericLiteral', () => {
  expect(
    extractFromCode(`
            <ColorBox zIndex={1}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "zIndex": 1,
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ThreeBox": [
        {
          "conditions": [],
          "raw": {
            "position": [
              -1.2466866852487384,
              0.3325255778835592,
              -0.6517939595349769,
            ],
            "scale": 1.25,
            "someProp": -2,
            "zIndex": 1,
          },
          "spreadConditions": [],
        },
      ],
    }
  `)
})

it('extract JsxAttribute > JsxExpression > Identifier > NumericLiteral', () => {
  expect(
    extractFromCode(`
            const nbIndex = 2;
            <ColorBox zIndex={nbIndex}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "zIndex": 2,
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "zIndex": 3,
          },
          "spreadConditions": [],
        },
      ],
    }
  `)
})

it('extract JsxAttribute > JsxExpression > CallExpression > immediately invoked > NumericLiteral', () => {
  expect(
    extractFromCode(`
            <ColorBox zIndex={(() => 4)()}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "zIndex": 4,
          },
          "spreadConditions": [],
        },
      ],
    }
  `)
})

it('extract JsxAttribute > JsxExpression > CallExpression > optional + NonNullable + AsExpression > NumericLiteral', () => {
  expect(
    extractFromCode(`
            const getMap = { get: () => 5 };
            <ColorBox zIndex={(getMap?.get()!) as any}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "zIndex": 5,
          },
          "spreadConditions": [],
        },
      ],
    }
  `)
})

it('extract JsxAttribute > JsxExpression > ElementAccessExpression > NumericLiteral', () => {
  expect(
    extractFromCode(`
            const map = { thing: 6 };
            <ColorBox zIndex={map["thing"]}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "zIndex": 6,
          },
          "spreadConditions": [],
        },
      ],
    }
  `)
})

it('extract JsxAttribute > JsxExpression > ObjectLiteralExpression > conditional sprinkles', () => {
  expect(
    extractFromCode(`
            <ColorBox color={{ mobile: "white.300", tablet: "white.400", desktop: "white.500" }}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": {
              "desktop": "white.500",
              "mobile": "white.300",
              "tablet": "white.400",
            },
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": {
              "desktop": "white.800",
              "mobile": "white.600",
              "tablet": "white.700",
            },
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": {
              "desktop": "white.800",
              "mobile": "white.600",
              "tablet": "white.700",
            },
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": {
              "desktop": "black.300",
              "mobile": "black.100",
              "tablet": "black.200",
            },
          },
          "spreadConditions": [],
        },
      ],
    }
  `)
})

it('extract JsxAttribute > JsxExpression > ConditionalExpression > StringLiteral/ObjectLiteralExpression (conditional sprinkles) > truthy', () => {
  expect(
    extractFromCode(`
            <ColorBox color={true ? { mobile: "black.400", tablet: "black.500", desktop: "black.600" } : "black.700"}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": {
              "desktop": "black.600",
              "mobile": "black.400",
              "tablet": "black.500",
            },
          },
          "spreadConditions": [],
        },
      ],
    }
  `)
})

it('extract JsxAttribute > JsxExpression > ConditionalExpression > StringLiteral/ObjectLiteralExpression (conditional sprinkles) > falsy', () => {
  expect(
    extractFromCode(`
            <ColorBox color={false ? { mobile: "black.400", tablet: "black.500", desktop: "black.600" } : "black.700"}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "black.700",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [
            {
              "color": {
                "desktop": "black.600",
                "mobile": "black.400",
                "tablet": "black.500",
              },
            },
            {
              "color": "black.700",
            },
          ],
          "raw": {},
          "spreadConditions": [],
        },
      ],
    }
  `,
  )
})

it('extract JsxAttribute > JsxExpression > reversed', () => {
  expect(
    extractFromCode(`
            <ColorBox mobile={{ color: "sky.100", tablet: "sky.200", desktop: "sky.300" }} />
        `),
  ).toMatchInlineSnapshot(`
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "mobile": {
              "color": "sky.100",
              "desktop": "sky.300",
              "tablet": "sky.200",
            },
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "css": {
              "__color": "##ff0",
              "backgroundColor": "sky.500",
              "mobile": {
                "display": "flex",
                "fontSize": "2xl",
              },
              "zIndex": {
                "desktop": "10",
              },
            },
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [
            {
              "css": {
                "mobile": {
                  "display": "flex",
                },
              },
            },
            {
              "css": {
                "mobile": {
                  "display": "block",
                },
              },
            },
          ],
          "raw": {
            "css": {
              "__color": "##ff0",
              "backgroundColor": "sky.600",
              "mobile": {
                "fontSize": "2xl",
              },
              "zIndex": {
                "desktop": "10",
              },
            },
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [
            {
              "css": {
                "backgroundColor": "sky.800",
              },
            },
            {
              "css": {
                "backgroundColor": "sky.900",
              },
            },
            {
              "css": {
                "mobile": {
                  "display": "flex",
                  "fontSize": "2xl",
                },
              },
            },
            {
              "css": {
                "mobile": "crimson.900",
              },
            },
          ],
          "raw": {
            "css": {
              "__color": "##ff0",
              "zIndex": {
                "desktop": "10",
              },
            },
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [
            {
              "color": "apple.100",
            },
          ],
          "raw": {},
          "spreadConditions": [],
        },
      ],
    }
  `)
})

it('extract JsxAttribute > JsxExpression > Identifier > BinaryExpression > (PropertyAccessExpression + AmpersandAmpersandToken + StringLiteral)', () => {
  expect(
    extractFromCode(`
            const color = props.color && "apple.200";

            <ColorBox color={color}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
    {
      "ColorBox": [
        {
          "conditions": [
            {
              "color": "apple.200",
            },
          ],
          "raw": {},
          "spreadConditions": [],
        },
      ],
    }
  `)
})

it('extract JsxAttribute > JsxExpression > Identifier > BinaryExpression > (PropertyAccessExpression + BarBarToken + StringLiteral)', () => {
  expect(
    extractFromCode(`
            const color = props.color || "apple.300";

            <ColorBox color={color}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
    {
      "ColorBox": [
        {
          "conditions": [
            {
              "color": "apple.300",
            },
          ],
          "raw": {},
          "spreadConditions": [],
        },
      ],
    }
  `)
})

it('extract JsxAttribute > JsxExpression > Identifier > ArrayLiteralExpression)', () => {
  expect(
    extractFromCode(`
            const color = ["apple.400", "apple.500"];

            <ColorBox color={color}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": [
              "apple.400",
              "apple.500",
            ],
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "apple.600",
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "Container": [
        {
          "conditions": [],
          "raw": {
            "withBorder": true,
          },
          "spreadConditions": [],
        },
      ],
      "someFn": [
        {
          "conditions": [],
          "raw": [
            {
              "isFlex": false,
            },
          ],
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "Container": [
        {
          "conditions": [],
          "raw": {
            "classNames": [
              "color:main",
              "hover:secondary",
            ],
            "config": {
              "state": [
                "hovered",
                "focused",
              ],
            },
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "Flex": [
        {
          "conditions": [],
          "raw": {
            "col": true,
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "defineProperties": [
        {
          "conditions": [],
          "raw": [
            {
              "properties": {
                "display": [
                  "block",
                  "inline-block",
                  "flex",
                  "inline-flex",
                ],
                "position": [
                  "relative",
                  "absolute",
                ],
              },
              "shorthands": {
                "d": [
                  "display",
                ],
                "p": [
                  "position",
                ],
              },
            },
          ],
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "Box": [
        {
          "conditions": [
            {
              "flexDirection": "column",
            },
          ],
          "raw": {
            "display": "flex",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {},
          "spreadConditions": [],
        },
      ],
      "Stack": [
        {
          "conditions": [],
          "raw": {
            "_tablet": {
              "justifyContent": "space-between",
            },
            "alignItems": "flex-end",
            "as": "header",
            "borderBottomColor": "gray.400",
            "borderBottomWidth": "1px",
            "flexWrap": "wrap",
            "justifyContent": "flex-end",
            "paddingBottom": 2,
            "paddingRight": 2,
          },
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "button": [
        {
          "conditions": [],
          "raw": [
            {
              "color": "accent",
              "rounded": true,
              "size": "large",
            },
          ],
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "div": [
        {
          "conditions": [],
          "raw": {
            "className": "bg-slate-100 rounded-xl p-8 dark:bg-slate-800",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [
            {
              "className": [
                "bg-sky-400",
                "text-lg",
              ],
            },
            {
              "className": "bg-sky-800",
            },
          ],
          "raw": {},
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "className": "bg-sky-400 text-lg bg-sky-800",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "className": "bg-red-400 bg-white rounded w-48 text-sm",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {},
          "spreadConditions": [],
        },
      ],
    }
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
    {
      "defineProperties": [
        {
          "conditions": [],
          "raw": [
            {
              "properties": {
                "backgroundColor": {
                  "error": "var(--backgroundColor-error__1dghp00s)",
                  "warning": "var(--backgroundColor-warning__1dghp00t)",
                },
                "display": true,
              },
              "shorthands": {
                "margin": [
                  "marginTop",
                ],
              },
            },
          ],
          "spreadConditions": [],
        },
      ],
    }
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
        "box": {
          "column": 39,
          "line": 15,
          "node": "CallExpression",
          "type": "array",
          "value": [
            {
              "column": 51,
              "line": 15,
              "node": "StringLiteral",
              "type": "literal",
              "value": "contract",
            },
            {
              "column": 39,
              "line": 15,
              "node": "CallExpression",
              "type": "map",
              "value": Map {
                "color" => {
                  "column": 20,
                  "line": 16,
                  "node": "ObjectLiteralExpression",
                  "type": "map",
                  "value": Map {
                    "mainBg" => {
                      "column": 20,
                      "line": 5,
                      "node": "StringLiteral",
                      "type": "literal",
                      "value": "#95a7d8",
                    },
                  },
                },
              },
            },
          ],
        },
        "kind": "call-expression",
        "name": "createTheme",
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
        "box": {
          "column": 38,
          "line": 2,
          "node": "CallExpression",
          "type": "array",
          "value": [
            {
              "column": 50,
              "line": 2,
              "node": "StringLiteral",
              "type": "literal",
              "value": "contract",
            },
            {
              "column": 38,
              "line": 2,
              "node": "CallExpression",
              "type": "map",
              "value": Map {
                "color" => {
                  "column": 20,
                  "line": 3,
                  "node": "ObjectLiteralExpression",
                  "type": "map",
                  "value": Map {
                    "mainBg" => {
                      "column": 25,
                      "line": 4,
                      "node": "NullKeyword",
                      "type": "literal",
                      "value": null,
                    },
                    "secondaryBg" => {
                      "column": 30,
                      "line": 5,
                      "node": "NullKeyword",
                      "type": "literal",
                      "value": null,
                    },
                    "text" => {
                      "column": 23,
                      "line": 6,
                      "node": "NullKeyword",
                      "type": "literal",
                      "value": null,
                    },
                    "bg" => {
                      "column": 21,
                      "line": 7,
                      "node": "NullKeyword",
                      "type": "literal",
                      "value": null,
                    },
                    "bgSecondary" => {
                      "column": 30,
                      "line": 8,
                      "node": "NullKeyword",
                      "type": "literal",
                      "value": null,
                    },
                    "bgHover" => {
                      "column": 26,
                      "line": 9,
                      "node": "NullKeyword",
                      "type": "literal",
                      "value": null,
                    },
                  },
                },
              },
            },
          ],
        },
        "kind": "call-expression",
        "name": "createTheme",
      },
    ]
  `)
})

it('extract UndefinedKeyword', () => {
  expect(extractFromCode(`<ColorBox color={undefined} />`)).toMatchInlineSnapshot(`
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {},
          "spreadConditions": [],
        },
      ],
    }
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
        "box": {
          "column": 5,
          "line": 13,
          "node": "CallExpression",
          "type": "array",
          "value": [
            {
              "column": 5,
              "line": 13,
              "node": "CallExpression",
              "type": "map",
              "value": Map {
                "background" => {
                  "column": 25,
                  "line": 15,
                  "node": "TemplateExpression",
                  "type": "literal",
                  "value": "linear-gradient(to bottom, var(--color-mainBg__1du39r70) 20%, var(--color-secondaryBg__1du39r71))",
                },
                "backgroundAttachment" => {
                  "column": 35,
                  "line": 16,
                  "node": "StringLiteral",
                  "type": "literal",
                  "value": "fixed",
                },
                "color" => {
                  "column": 21,
                  "line": 6,
                  "node": "StringLiteral",
                  "type": "literal",
                  "value": "var(--color-text__1du39r72)",
                },
              },
            },
          ],
        },
        "kind": "call-expression",
        "name": "css",
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
        "box": {
          "column": 26,
          "line": 16,
          "node": "CallExpression",
          "type": "array",
          "value": [
            {
              "column": 37,
              "line": 16,
              "node": "Identifier",
              "type": "unresolvable",
              "value": undefined,
            },
            {
              "column": 26,
              "line": 16,
              "node": "CallExpression",
              "type": "map",
              "value": Map {
                "color" => {
                  "column": 20,
                  "line": 17,
                  "node": "ObjectLiteralExpression",
                  "type": "map",
                  "value": Map {
                    "mainBg" => {
                      "column": 20,
                      "line": 9,
                      "node": "StringLiteral",
                      "type": "literal",
                      "value": "#39539b",
                    },
                    "secondaryBg" => {
                      "column": 20,
                      "line": 10,
                      "node": "StringLiteral",
                      "type": "literal",
                      "value": "#324989",
                    },
                    "bg" => {
                      "column": 20,
                      "line": 6,
                      "node": "StringLiteral",
                      "type": "literal",
                      "value": "#8297d1",
                    },
                    "bgSecondary" => {
                      "column": 20,
                      "line": 11,
                      "node": "StringLiteral",
                      "type": "literal",
                      "value": "#2b3f76",
                    },
                    "bgHover" => {
                      "column": 20,
                      "line": 10,
                      "node": "StringLiteral",
                      "type": "literal",
                      "value": "#324989",
                    },
                  },
                },
              },
            },
          ],
        },
        "kind": "call-expression",
        "name": "assignVars",
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
    Map {
      "defineProperties" => {
        "kind": "function",
        "nodesByProp": Map {},
        "queryList": [
          {
            "box": {
              "column": 25,
              "line": 2,
              "node": "CallExpression",
              "type": "array",
              "value": [],
            },
            "kind": "call-expression",
            "name": "defineProperties",
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
    {
      "css": [
        {
          "conditions": [],
          "raw": [
            {
              "selectors": {
                "&:hover": {
                  "background": "red.200",
                },
              },
            },
          ],
          "spreadConditions": [],
        },
      ],
    }
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
  ).toMatchInlineSnapshot(`
    {
      "factory": [
        {
          "conditions": [],
          "raw": [
            "span",
            undefined,
          ],
          "spreadConditions": [],
        },
      ],
    }
  `)
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
    {
      "div": [
        {
          "conditions": [],
          "raw": {
            "background": "#e879f91a",
            "backgroundSize": "8px 8px",
            "display": "flex",
            "flexDir": "column",
            "marginTop": "3",
            "style": {
              "backgroundImage": "linear-gradient( 135deg, #d946ef80 10%, transparent 0, transparent 50%, #d946ef80 0, #d946ef80 60%, transparent 0, transparent )",
            },
          },
          "spreadConditions": [],
        },
      ],
    }
  `)
})

it('handles merge spread', () => {
  expect(
    extractFromCode(
      `<div>
        <ColorBox color="never.100" padding="4" {...{ color: "never.200" }} color="after.300" margin={2} />
        <ColorBox color="never.400" padding="4" {...{ color: "spread.500" }} margin={2} />
      </div>`,
      {
        tagNameList: ['ColorBox'],
      },
    ),
  ).toMatchInlineSnapshot(`
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "after.300",
            "margin": 2,
            "padding": "4",
          },
          "spreadConditions": [],
        },
        {
          "conditions": [],
          "raw": {
            "color": "spread.500",
            "margin": 2,
            "padding": "4",
          },
          "spreadConditions": [],
        },
      ],
    }
  `)
})

it('handles root spread conditional', () => {
  expect(
    extractFromCode(`<ColorBox {...(someCondition && { color: "facebook.100" })} />`, { tagNameList: ['ColorBox'] }),
  ).toMatchInlineSnapshot(`
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {},
          "spreadConditions": [
            {
              "color": "facebook.100",
            },
          ],
        },
      ],
    }
  `)
})

it('handles root tagged template literals', () => {
  expect(
    extractFromCode(
      `
    const Title = styled.h1\`
      font-size: 1.5em;
      text-align: center;
      color: #BF4F74;
    \`;

    // Create a Wrapper component that'll render a <section> tag with some styles
    const Wrapper = styled.section\`
      padding: 4em;
      background: papayawhip;
    \`;

    const className = styled({
      styles: css\`
      font-size: 1.5em;
      text-align: center;
      color: #BF4F74;
    \`
    })

    const ignored = styled\`
      font-size: 3rem;
      text-align: right;
      color: red;
    \`
`,
      { taggedTemplates: { matchTaggedTemplate: (tag) => tag.fnName.startsWith('styled.') || tag.fnName === 'css' } },
    ),
  ).toMatchInlineSnapshot(`
    {
      "css": [
        {
          "conditions": [],
          "raw": " font-size: 1.5em; text-align: center; color: #BF4F74; ",
          "spreadConditions": [],
        },
      ],
      "styled.h1": [
        {
          "conditions": [],
          "raw": " font-size: 1.5em; text-align: center; color: #BF4F74; ",
          "spreadConditions": [],
        },
      ],
      "styled.section": [
        {
          "conditions": [],
          "raw": " padding: 4em; background: papayawhip; ",
          "spreadConditions": [],
        },
      ],
    }
  `)
})

it('handles operation tokens', () => {
  expect(
    extractFromCode(
      `<>
  <AspectRatio ratio={1 / 2} asterisk={1 *5} exp={1**4} minus={5 -1} />
  `,
      { tagNameList: ['AspectRatio'] },
    ),
  ).toMatchInlineSnapshot(`
    {
      "AspectRatio": [
        {
          "conditions": [],
          "raw": {
            "asterisk": 5,
            "exp": 1,
            "minus": 4,
            "ratio": 0.5,
          },
          "spreadConditions": [],
        },
      ],
    }
  `)
})

it('resolves shorthands identifier ShorthandPropertyAssignment', () => {
  expect(
    extractFromCode(
      `const color = "red.100";
      css({ color })`,
      { functionNameList: ['css'] },
    ),
  ).toMatchInlineSnapshot(`
    {
      "css": [
        {
          "conditions": [],
          "raw": [
            {
              "color": "red.100",
            },
          ],
          "spreadConditions": [],
        },
      ],
    }
  `)
})

it('resolves identifier pointing to default value on parameters JsxExpression > Identifier > BindingElement > StringLiteral', () => {
  expect(
    extractFromCode(
      `import { styled, HTMLStyledProps } from "../styled-system/jsx";

      type PositionedProps = HTMLStyledProps<"div">;

      export const Positioned: React.FC<PositionedProps> = ({
        children,
        position = "absolute",
        inset = 0,
        ...rest
      }) => (
        <styled.div position={position} inset={inset} {...rest}>
          {children}
        </styled.div>
      );

      export default Positioned;
      `,
      { tagNameList: ['styled.div'] },
    ),
  ).toMatchInlineSnapshot(`
    {
      "styled.div": [
        {
          "conditions": [],
          "raw": {
            "inset": 0,
            "position": "absolute",
          },
          "spreadConditions": [],
        },
      ],
    }
  `)
})

it('still explore both branches when using a default value as the condition expression', () => {
  expect(
    extractFromCode(
      `import { css } from "../panda/css";

      const CompB = ({ disabled = false }: { disabled: boolean }) => {
        return (
          <div className={css({ color: disabled ? 'blue' : 'yellow' })}>
            Component B is {disabled ? 'disabled' : 'not disabled'}
          </div>
        );
      };
      `,
      { functionNameList: ['css'] },
    ),
  ).toMatchInlineSnapshot(`
    {
      "css": [
        {
          "conditions": [
            {
              "0": {
                "color": "blue",
              },
            },
            {
              "0": {
                "color": "yellow",
              },
            },
          ],
          "raw": [
            {},
          ],
          "spreadConditions": [],
        },
      ],
    }
  `)
})

it('extract all `css` style objects', () => {
  expect(
    extractFromCode(
      `import { css } from "../panda/css";

      css({ mx: '3', paddingTop: '4' }, { mx: '10', pt: '6' })
      `,
      { functionNameList: ['css'] },
    ),
  ).toMatchInlineSnapshot(`
    {
      "css": [
        {
          "conditions": [],
          "raw": [
            {
              "mx": "3",
              "paddingTop": "4",
            },
            {
              "mx": "10",
              "pt": "6",
            },
          ],
          "spreadConditions": [],
        },
      ],
    }
  `)
})

it('unwrapExpression with satisfies', () => {
  expect(
    extractFromCode(`
      const someObject = { red: "red.600" } satisfies any;
      <ColorBox color={someObject.red}></ColorBox>
        `),
  ).toMatchInlineSnapshot(`
    {
      "ColorBox": [
        {
          "conditions": [],
          "raw": {
            "color": "red.600",
          },
          "spreadConditions": [],
        },
      ],
    }
  `)
})

it('extracts arrays without removing nullish values', () => {
  expect(
    extractFromCode(
      `
    const className = css({
      display: "flex", color: ['black', undefined, "orange", 'red'],
    })`,
      { functionNameList: ['css'] },
    ),
  ).toMatchInlineSnapshot(`
    {
      "css": [
        {
          "conditions": [],
          "raw": [
            {
              "color": [
                "black",
                undefined,
                "orange",
                "red",
              ],
              "display": "flex",
            },
          ],
          "spreadConditions": [],
        },
      ],
    }
  `)
})

it('extracts props after a JSX attribute containing a JSX element', () => {
  expect(
    extractFromCode(
      `
      export const App = () => {
        return (
          <>
            <Flex icon={<svg />} ml="2" />
            <Stack ml="4" icon={<div />} />
          </>
        );
      };
          `,
      { tagNameList: ['Flex', 'Stack'] },
    ),
  ).toMatchInlineSnapshot(`
    {
      "Flex": [
        {
          "conditions": [],
          "raw": {
            "ml": "2",
          },
          "spreadConditions": [],
        },
      ],
      "Stack": [
        {
          "conditions": [],
          "raw": {
            "ml": "4",
          },
          "spreadConditions": [],
        },
      ],
    }
  `)
})

it('extracts props after a JSX spread containing a JSX element', () => {
  expect(
    extractFromCode(
      `
      export const App = () => {
        return (
          <>
            <Flex {...{ icon: <svg /> }} ml="2" />
            <Stack ml="4" {...{ icon: <div /> }} />
          </>
        );
      };
          `,
      { tagNameList: ['Flex', 'Stack'] },
    ),
  ).toMatchInlineSnapshot(`
    {
      "Flex": [
        {
          "conditions": [],
          "raw": {
            "ml": "2",
          },
          "spreadConditions": [],
        },
      ],
      "Stack": [
        {
          "conditions": [],
          "raw": {
            "ml": "4",
          },
          "spreadConditions": [],
        },
      ],
    }
  `)
})

it('handles TS enum', () => {
  const code = `import { sva } from 'styled-system/css';

  enum Size {
    S = 's',
    L = 'l',
  };

  enum Color {
    Red = 'red.400',
    Blue = 'blue.400',
  }

  const className = css({ color: Color.Red, backgroundColor: Color["Blue"] })

  const useStyles = sva({
    slots: ['root'],
    base: {
      root: {}
    },
    variants: {
      size: {
        [Size.S]: {
          root: {
            bgColor: 'red'
          }
        }
      }
    }
  });`

  expect(extractFromCode(code, { functionNameList: ['css', 'sva'] })).toMatchInlineSnapshot(`
    {
      "css": [
        {
          "conditions": [],
          "raw": [
            {
              "backgroundColor": "blue.400",
              "color": "red.400",
            },
          ],
          "spreadConditions": [],
        },
      ],
      "sva": [
        {
          "conditions": [],
          "raw": [
            {
              "base": {
                "root": {},
              },
              "slots": [
                "root",
              ],
              "variants": {
                "size": {
                  "s": {
                    "root": {
                      "bgColor": "red",
                    },
                  },
                },
              },
            },
          ],
          "spreadConditions": [],
        },
      ],
    }
  `)
})
