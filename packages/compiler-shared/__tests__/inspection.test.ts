import { describe, expect, test } from 'vitest'
import { createUsageReport } from '../src'
import type { FileInspectionBatch, FileInspectionResult, SourceRange, Spec } from '../src'

const range: SourceRange = {
  start: { line: 1, column: 1 },
  end: { line: 1, column: 10 },
}

const rawRange: SourceRange = {
  start: { line: 2, column: 1 },
  end: { line: 2, column: 10 },
}

function file(input: Partial<FileInspectionResult> = {}): FileInspectionResult {
  return {
    path: 'app.tsx',
    usages: [],
    diagnostics: [],
    calls: [],
    jsx: [],
    tokenRefs: [],
    componentEntries: [],
    styleEntries: [],
    ...input,
  }
}

describe('createUsageReport', () => {
  test('summarizes usage directly from file inspection results', () => {
    const inspection: FileInspectionBatch = {
      sourceCount: 1,
      files: [
        file({
          usages: [
            { kind: 'token', name: 'colors.red.500', range },
            { kind: 'keyframe', name: 'spin', range },
          ],
          componentEntries: [{ kind: 'jsx-recipe', name: 'button', span: { start: 0, end: 4 }, range }],
          styleEntries: [
            {
              kind: 'utility',
              syntax: 'css-call',
              owner: { kind: 'call', index: 0 },
              origin: 'local',
              span: { start: 0, end: 4 },
              range,
              path: ['color'],
              name: 'color',
              sourceValue: 'red.500',
              resolvedValue: 'red.500',
              fixable: 'safe',
            },
            {
              kind: 'pattern-prop',
              syntax: 'pattern-call',
              owner: { kind: 'call', index: 1 },
              origin: 'local',
              span: { start: 0, end: 4 },
              range: rawRange,
              path: ['gap'],
              name: 'stack',
              sourceValue: '4',
              resolvedValue: '4',
              fixable: 'safe',
            },
          ],
        }),
      ],
    }

    expect(createUsageReport(inspection)).toMatchInlineSnapshot(`
      {
        "facts": {
          "files": [
            {
              "diagnostics": 0,
              "id": 0,
              "path": "app.tsx",
            },
          ],
          "rawValueSuggestions": [],
          "rawValueUsages": [],
          "rawValues": [],
          "recipeUsages": [],
          "recipeVariantUsages": [],
          "recipes": [],
          "tokenUsages": [],
          "tokens": [],
        },
        "files": [
          {
            "counts": {
              "keyframes": 1,
              "patterns": 1,
              "recipes": 1,
              "tokens": 1,
              "utilities": 1,
            },
            "diagnostics": 0,
            "path": "app.tsx",
            "sourceUsages": 5,
          },
        ],
        "scope": "all",
        "sourceCount": 1,
        "sourceUsages": 5,
        "summary": {
          "keyframes": {
            "unique": 1,
            "used": 1,
          },
          "patterns": {
            "unique": 1,
            "used": 1,
          },
          "recipes": {
            "unique": 1,
            "used": 1,
          },
          "tokens": {
            "unique": 1,
            "used": 1,
          },
          "utilities": {
            "unique": 1,
            "used": 1,
          },
        },
      }
    `)

    expect(createUsageReport(inspection, { scope: 'tokens' })).toMatchInlineSnapshot(`
      {
        "facts": {
          "files": [
            {
              "diagnostics": 0,
              "id": 0,
              "path": "app.tsx",
            },
          ],
          "rawValueSuggestions": [],
          "rawValueUsages": [],
          "rawValues": [],
          "recipeUsages": [],
          "recipeVariantUsages": [],
          "recipes": [],
          "tokenUsages": [],
          "tokens": [],
        },
        "files": [
          {
            "counts": {
              "keyframes": 0,
              "patterns": 0,
              "recipes": 0,
              "tokens": 1,
              "utilities": 0,
            },
            "diagnostics": 0,
            "path": "app.tsx",
            "sourceUsages": 1,
          },
        ],
        "scope": "tokens",
        "sourceCount": 1,
        "sourceUsages": 1,
        "summary": {
          "keyframes": {
            "unique": 0,
            "used": 0,
          },
          "patterns": {
            "unique": 0,
            "used": 0,
          },
          "recipes": {
            "unique": 0,
            "used": 0,
          },
          "tokens": {
            "unique": 1,
            "used": 1,
          },
          "utilities": {
            "unique": 0,
            "used": 0,
          },
        },
      }
    `)
  })

  test('joins inspection with spec metadata for coverage sections', () => {
    const inspection: FileInspectionBatch = {
      sourceCount: 1,
      files: [
        file({
          usages: [
            { kind: 'token', name: 'colors.red.500', range },
            { kind: 'recipe', name: 'button', range },
          ],
          componentEntries: [
            { kind: 'jsx-recipe', name: 'Button', recipe: 'button', span: { start: 0, end: 4 }, range },
          ],
          styleEntries: [
            {
              kind: 'utility',
              syntax: 'css-call',
              owner: { kind: 'call', index: 0 },
              origin: 'local',
              span: { start: 0, end: 4 },
              range,
              path: ['color'],
              name: 'color',
              sourceValue: '#ef4444',
              resolvedValue: '#ef4444',
              fixable: 'safe',
              valueSpans: [{ value: '#ef4444', span: { start: 0, end: 4 } }],
            },
            {
              kind: 'recipe-variant',
              syntax: 'recipe-call',
              owner: { kind: 'call', index: 1 },
              origin: 'local',
              span: { start: 0, end: 4 },
              range,
              path: ['variants', 'size', 'sm'],
              name: 'button',
              sourceValue: 'sm',
              resolvedValue: 'sm',
              fixable: 'safe',
            },
          ],
        }),
      ],
    }

    expect(
      createUsageReport(inspection, {
        spec,
        suggestTokens: (prop, value) =>
          prop === 'color' && value === '#ef4444' ? [{ token: 'red.500', semantic: false, conditional: false }] : [],
      }),
    ).toMatchInlineSnapshot(`
      {
        "facts": {
          "files": [
            {
              "diagnostics": 0,
              "id": 0,
              "path": "app.tsx",
            },
          ],
          "rawValueSuggestions": [],
          "rawValueUsages": [],
          "rawValues": [],
          "recipeUsages": [
            {
              "column": 1,
              "fileId": 0,
              "line": 1,
              "recipeId": 0,
              "syntax": "fn",
            },
            {
              "column": 1,
              "fileId": 0,
              "line": 1,
              "recipeId": 0,
              "syntax": "jsx",
            },
          ],
          "recipeVariantUsages": [
            {
              "column": 1,
              "fileId": 0,
              "line": 1,
              "recipeId": 0,
              "value": "sm",
              "variant": "size",
            },
          ],
          "recipes": [
            {
              "configured": true,
              "id": 0,
              "name": "button",
              "totalVariantValues": 4,
            },
          ],
          "tokenUsages": [
            {
              "column": 1,
              "fileId": 0,
              "line": 1,
              "tokenId": 1,
            },
          ],
          "tokens": [
            {
              "category": "colors",
              "configured": true,
              "id": 0,
              "path": "colors.blue.500",
            },
            {
              "category": "colors",
              "configured": true,
              "id": 1,
              "path": "colors.red.500",
            },
          ],
        },
        "files": [
          {
            "counts": {
              "keyframes": 0,
              "patterns": 0,
              "recipes": 3,
              "tokens": 1,
              "utilities": 1,
            },
            "diagnostics": 0,
            "path": "app.tsx",
            "sourceUsages": 5,
          },
        ],
        "scope": "all",
        "sourceCount": 1,
        "sourceUsages": 5,
        "summary": {
          "keyframes": {
            "total": 1,
            "unique": 0,
            "used": 0,
          },
          "patterns": {
            "total": 0,
            "unique": 0,
            "used": 0,
          },
          "recipes": {
            "total": 1,
            "unique": 1,
            "used": 3,
          },
          "tokens": {
            "total": 2,
            "unique": 1,
            "used": 1,
          },
          "utilities": {
            "total": 1,
            "unique": 1,
            "used": 1,
          },
        },
        "views": {
          "recipes": {
            "recipes": [
              {
                "files": 1,
                "name": "button",
                "percentUsed": 25,
                "top": [
                  {
                    "files": 1,
                    "name": "size.sm",
                    "uses": 1,
                  },
                ],
                "totalVariantValues": 4,
                "unusedVariantValues": 3,
                "usedAs": {
                  "fn": 1,
                  "jsx": 1,
                },
                "usedVariantValues": 1,
              },
            ],
          },
          "tokens": {
            "categories": [
              {
                "category": "colors",
                "files": 1,
                "percentUsed": 50,
                "rawValues": [],
                "top": [
                  {
                    "files": 1,
                    "name": "red.500",
                    "uses": 1,
                  },
                ],
                "total": 2,
                "unused": 1,
                "used": 1,
              },
            ],
          },
        },
      }
    `)
  })
})

const spec: Spec = {
  conditions: { keys: [], breakpoints: [], containers: [] },
  tokens: {
    categories: {
      colors: { name: 'colors', typeName: 'ColorsToken', values: ['red.500', 'blue.500'] },
    },
    colorPalettes: [],
    values: { 'colors.red.500': '#ef4444', 'colors.blue.500': '#3b82f6' },
    deprecated: {},
  },
  utilities: {
    properties: {
      color: { name: 'color', tokenCategory: 'colors', literals: [], alias: 'ColorsValue' },
    },
    shorthands: {},
    deprecated: {},
  },
  keyframes: { keys: ['spin'] },
  patterns: {},
  recipes: {
    button: {
      name: 'button',
      typeName: 'ButtonRecipe',
      variants: {
        size: { values: ['sm', 'md'], allowsBoolean: false },
        variant: { values: ['solid', 'outline'], allowsBoolean: false },
      },
    },
  },
  slotRecipes: {},
  propertyOrder: [],
}
