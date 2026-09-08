import { inspect } from 'node:util'
import { describe, expect, test } from 'vitest'
import { createUsageReport } from '../src'
import type { FileInspectionBatch, FileInspectionResult, SourceRange, Spec, UsageReport } from '../src'

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

    expect(condense(createUsageReport(inspection))).toMatchInlineSnapshot(`
      {
        "facts": {
          "files": [
            "{ id: 0, path: 'app.tsx', diagnostics: 0 }",
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
          "{ path: 'app.tsx', counts: { tokens: 1, recipes: 1, utilities: 1, patterns: 1, keyframes: 1 }, diagnostics: 0, sourceUsages: 5 }",
        ],
        "scope": "all",
        "sourceCount": 1,
        "sourceUsages": 5,
        "summary": {
          "keyframes": "{ used: 1, unique: 1 }",
          "patterns": "{ used: 1, unique: 1 }",
          "recipes": "{ used: 1, unique: 1 }",
          "tokens": "{ used: 1, unique: 1 }",
          "utilities": "{ used: 1, unique: 1 }",
        },
        "usages": [
          "{ kind: 'keyframe', name: 'spin', file: 'app.tsx', line: 1, column: 1 }",
          "{ kind: 'recipe', name: 'button', file: 'app.tsx', line: 1, column: 1 }",
          "{ kind: 'token', name: 'colors.red.500', file: 'app.tsx', line: 1, column: 1 }",
          "{ kind: 'utility', name: 'color', file: 'app.tsx', line: 1, column: 1 }",
          "{ kind: 'pattern', name: 'stack', file: 'app.tsx', line: 2, column: 1 }",
        ],
        "views": undefined,
      }
    `)

    expect(condense(createUsageReport(inspection, { scope: 'tokens' }))).toMatchInlineSnapshot(`
      {
        "facts": {
          "files": [
            "{ id: 0, path: 'app.tsx', diagnostics: 0 }",
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
          "{ path: 'app.tsx', counts: { tokens: 1, recipes: 0, utilities: 0, patterns: 0, keyframes: 0 }, diagnostics: 0, sourceUsages: 1 }",
        ],
        "scope": "tokens",
        "sourceCount": 1,
        "sourceUsages": 1,
        "summary": {
          "keyframes": "{ used: 0, unique: 0 }",
          "patterns": "{ used: 0, unique: 0 }",
          "recipes": "{ used: 0, unique: 0 }",
          "tokens": "{ used: 1, unique: 1 }",
          "utilities": "{ used: 0, unique: 0 }",
        },
        "usages": [
          "{ kind: 'token', name: 'colors.red.500', file: 'app.tsx', line: 1, column: 1 }",
        ],
        "views": undefined,
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
          calls: [
            { category: 'css', name: 'css', alias: 'css', data: [], span: { start: 0, end: 4 }, range },
            { category: 'recipe', name: 'button', alias: 'button', data: [], span: { start: 0, end: 4 }, range },
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
      condense(
        createUsageReport(inspection, {
          spec,
          suggestTokens: (prop, value) =>
            prop === 'color' && value === '#ef4444' ? [{ token: 'red.500', semantic: false, conditional: false }] : [],
        }),
      ),
    ).toMatchInlineSnapshot(`
      {
        "facts": {
          "files": [
            "{ id: 0, path: 'app.tsx', diagnostics: 0 }",
          ],
          "rawValueSuggestions": [],
          "rawValueUsages": [],
          "rawValues": [],
          "recipeUsages": [
            "{ fileId: 0, recipeId: 0, syntax: 'fn', line: 1, column: 1 }",
            "{ fileId: 0, recipeId: 0, syntax: 'jsx', line: 1, column: 1 }",
          ],
          "recipeVariantUsages": [
            "{ fileId: 0, recipeId: 0, variant: 'size', value: 'sm', line: 1, column: 1 }",
          ],
          "recipes": [
            "{ id: 0, name: 'button', totalVariantValues: 4, configured: true }",
          ],
          "tokenUsages": [
            "{ fileId: 0, tokenId: 1, line: 1, column: 1 }",
          ],
          "tokens": [
            "{ id: 0, path: 'colors.blue.500', category: 'colors', configured: true }",
            "{ id: 1, path: 'colors.red.500', category: 'colors', configured: true }",
          ],
        },
        "files": [
          "{ path: 'app.tsx', counts: { tokens: 1, recipes: 2, utilities: 1, patterns: 0, keyframes: 0 }, diagnostics: 0, sourceUsages: 4 }",
        ],
        "scope": "all",
        "sourceCount": 1,
        "sourceUsages": 4,
        "summary": {
          "keyframes": "{ used: 0, unique: 0, total: 1 }",
          "patterns": "{ used: 0, unique: 0, total: 0 }",
          "recipes": "{ used: 2, unique: 1, total: 1 }",
          "tokens": "{ used: 1, unique: 1, total: 2 }",
          "utilities": "{ used: 1, unique: 1, total: 1 }",
        },
        "usages": [
          "{ kind: 'recipe', name: 'button', file: 'app.tsx', line: 1, column: 1 }",
          "{ kind: 'recipe', name: 'button', file: 'app.tsx', line: 1, column: 1 }",
          "{ kind: 'token', name: 'colors.red.500', file: 'app.tsx', line: 1, column: 1 }",
          "{ kind: 'utility', name: 'color', file: 'app.tsx', line: 1, column: 1 }",
        ],
        "views": {
          "keyframes": {
            "items": [],
            "percentUsed": 0,
            "total": 1,
            "unused": [
              "spin",
            ],
            "used": 0,
          },
          "patterns": {
            "items": [],
            "percentUsed": 0,
            "total": 0,
            "unused": [],
            "used": 0,
          },
          "recipes": {
            "recipes": [
              "{ name: 'button', totalVariantValues: 4, usedVariantValues: 1, unusedVariantValues: 3, percentUsed: 25, files: 1, top: [ { name: 'size.sm', uses: 1, files: 1 } ], usedAs: { jsx: 1, fn: 1 } }",
            ],
            "unused": [],
          },
          "tokens": {
            "categories": [
              "{ category: 'colors', total: 2, used: 1, unused: 1, percentUsed: 50, files: 1, top: [ { name: 'red.500', uses: 1, files: 1 } ], rawValues: [] }",
            ],
            "unused": [
              "colors.blue.500",
            ],
          },
          "utilities": {
            "items": [
              "{ name: 'color', uses: 1, files: 1 }",
            ],
            "percentUsed": 100,
            "total": 1,
            "unused": [],
            "used": 1,
          },
        },
      }
    `)
  })

  test('does not report CSS keys inside a local cva or sva body as recipes', () => {
    const entry = (name: string, path: string[]): FileInspectionResult['styleEntries'][number] => ({
      kind: 'recipe-variant',
      syntax: 'recipe-call',
      owner: { kind: 'call', index: 0 },
      origin: 'local',
      span: { start: 0, end: 4 },
      range,
      path,
      name,
      sourceValue: '1',
      resolvedValue: '1',
      fixable: 'safe',
    })
    const inspection: FileInspectionBatch = {
      sourceCount: 1,
      files: [
        file({
          calls: [{ category: 'css', name: 'cva', alias: 'cva', data: [], span: { start: 0, end: 4 }, range }],
          styleEntries: [
            entry('--dialog-margin', ['variants', 'placement', 'center', 'content', '--dialog-margin']),
            entry('pointerEvents', ['variants', 'scrollBehavior', 'outside', 'positioner', 'pointerEvents']),
          ],
        }),
      ],
    }

    const report = createUsageReport(inspection, { spec })

    expect(report.summary.recipes).toEqual({ used: 0, unique: 0, total: 1 })
    expect(report.facts.recipes.map((recipe) => recipe.name)).toEqual(['button'])
    expect(report.facts.recipeVariantUsages).toEqual([])
    expect(report.views?.recipes.recipes).toEqual([])
  })

  test('lists every usage site flat, ordered by file position', () => {
    const later: SourceRange = { start: { line: 3, column: 5 }, end: { line: 3, column: 9 } }
    const inspection: FileInspectionBatch = {
      sourceCount: 2,
      files: [
        file({
          path: 'b.tsx',
          usages: [{ kind: 'keyframe', name: 'spin', range }],
        }),
        file({
          path: 'a.tsx',
          usages: [
            { kind: 'token', name: 'colors.red.500', range: later },
            { kind: 'recipe', name: 'button', range },
          ],
          componentEntries: [{ kind: 'jsx-pattern', name: 'stack', span: { start: 0, end: 4 }, range: rawRange }],
          styleEntries: [
            {
              kind: 'utility',
              syntax: 'css-call',
              owner: { kind: 'call', index: 0 },
              origin: 'local',
              span: { start: 0, end: 4 },
              range: rawRange,
              path: ['color'],
              name: 'color',
              sourceValue: 'red.500',
              resolvedValue: 'red.500',
              fixable: 'safe',
            },
          ],
        }),
      ],
    }

    expect(createUsageReport(inspection).usages).toEqual([
      { kind: 'recipe', name: 'button', file: 'a.tsx', line: 1, column: 1 },
      { kind: 'pattern', name: 'stack', file: 'a.tsx', line: 2, column: 1 },
      { kind: 'utility', name: 'color', file: 'a.tsx', line: 2, column: 1 },
      { kind: 'token', name: 'colors.red.500', file: 'a.tsx', line: 3, column: 5 },
      { kind: 'keyframe', name: 'spin', file: 'b.tsx', line: 1, column: 1 },
    ])
    expect(createUsageReport(inspection, { scope: 'tokens' }).usages).toEqual([
      { kind: 'token', name: 'colors.red.500', file: 'a.tsx', line: 3, column: 5 },
    ])
  })

  test('ranks utilities, patterns, and keyframes against what the config declares', () => {
    const utility = (name: string, canonicalName?: string): FileInspectionResult['styleEntries'][number] => ({
      kind: 'utility',
      syntax: 'css-call',
      owner: { kind: 'call', index: 0 },
      origin: 'local',
      span: { start: 0, end: 4 },
      range,
      path: [name],
      name,
      canonicalName,
      sourceValue: 'red.500',
      resolvedValue: 'red.500',
      fixable: 'safe',
    })
    const inspection: FileInspectionBatch = {
      sourceCount: 2,
      files: [
        file({ path: 'a.tsx', styleEntries: [utility('c', 'color'), utility('color')] }),
        file({
          path: 'b.tsx',
          usages: [{ kind: 'pattern', name: 'stack', range }],
          styleEntries: [utility('color')],
        }),
      ],
    }

    const report = createUsageReport(inspection, { spec })

    expect(report.summary.utilities).toEqual({ used: 3, unique: 1, total: 1 })
    expect(report.views?.utilities).toEqual({
      total: 1,
      used: 1,
      unused: [],
      percentUsed: 100,
      items: [{ name: 'color', uses: 3, files: 2 }],
    })
    expect(report.views?.patterns).toEqual({
      total: 0,
      used: 0,
      unused: [],
      percentUsed: 0,
      items: [{ name: 'stack', uses: 1, files: 1 }],
    })
    expect(report.views?.keyframes).toEqual({ total: 1, used: 0, unused: ['spin'], percentUsed: 0, items: [] })
  })

  test('names the configured tokens and recipes nothing uses', () => {
    const untouched = createUsageReport({ sourceCount: 1, files: [file()] }, { spec })
    expect(untouched.views?.tokens.unused).toEqual(['colors.blue.500', 'colors.red.500'])
    expect(untouched.views?.recipes.unused).toEqual(['button'])

    const touched = createUsageReport(
      {
        sourceCount: 1,
        files: [
          file({
            usages: [{ kind: 'token', name: 'colors.red.500', range }],
            componentEntries: [
              { kind: 'jsx-recipe', name: 'Button', recipe: 'button', span: { start: 0, end: 4 }, range },
            ],
          }),
        ],
      },
      { spec },
    )
    expect(touched.views?.tokens.unused).toEqual(['colors.blue.500'])
    expect(touched.views?.recipes.unused).toEqual([])
  })

  test('uses source-backed value spans for token usage locations', () => {
    const source = ['css({', "  color: 'red.500',", '})'].join('\n')
    const valueStart = source.indexOf("'red.500'")
    const inspection: FileInspectionBatch = {
      sourceCount: 1,
      files: [
        file({
          usages: [
            {
              kind: 'token',
              name: 'colors.red.500',
              range: { start: { line: 1, column: 1 }, end: { line: 3, column: 3 } },
            },
          ],
          styleEntries: [
            {
              kind: 'utility',
              syntax: 'css-call',
              owner: { kind: 'call', index: 0 },
              origin: 'local',
              span: { start: 0, end: source.length },
              range: { start: { line: 2, column: 3 }, end: { line: 2, column: 20 } },
              path: ['color'],
              name: 'color',
              sourceValue: 'red.500',
              resolvedValue: 'red.500',
              fixable: 'safe',
              valueSpans: [{ value: 'red.500', span: { start: valueStart, end: valueStart + "'red.500'".length } }],
            },
          ],
        }),
      ],
    }

    expect(createUsageReport(inspection, { spec, sourceByPath: { 'app.tsx': source } }).facts.tokenUsages).toEqual([
      {
        fileId: 0,
        tokenId: 1,
        line: 2,
        column: 11,
      },
    ])
  })
})

const range: SourceRange = {
  start: { line: 1, column: 1 },
  end: { line: 1, column: 10 },
}
const rawRange: SourceRange = {
  start: { line: 2, column: 1 },
  end: { line: 2, column: 10 },
}
const spec: Spec = {
  schemaVersion: 1,
  options: { strictTokens: false, strictPropertyValues: false, jsxStyleProps: 'all' },
  catalog: {
    conditions: {},
    tokens: {},
    recipes: {},
    slotRecipes: {},
    patterns: {},
    keyframes: {},
    textStyles: {},
    layerStyles: {},
    animationStyles: {},
    viewTransitions: {},
    positionTry: {},
    themes: {},
  },
  conditions: { keys: [], breakpoints: [], containers: [] },
  selectors: { selectors: [], arbitrary: [] },
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
      color: {
        name: 'color',
        cssProperty: null,
        mappedCssProperty: null,
        tokenCategory: 'colors',
        literals: [],
        primitive: null,
        alias: 'ColorsValue',
      },
    },
    shorthands: {},
    deprecated: {},
    aliases: {},
    classNames: {},
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
  jsxFactory: null,
  importMap: null,
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
function condense(report: UsageReport) {
  const row = (value: unknown) => inspect(value, { breakLength: Infinity, compact: true, depth: null })
  const rows = (items: unknown[]) => items.map(row)
  const { views } = report

  return {
    ...report,
    summary: Object.fromEntries(Object.entries(report.summary).map(([scope, entry]) => [scope, row(entry)])),
    files: rows(report.files),
    usages: rows(report.usages),
    facts: Object.fromEntries(Object.entries(report.facts).map(([table, items]) => [table, rows(items)])),
    views: views && {
      tokens: { categories: rows(views.tokens.categories), unused: views.tokens.unused },
      recipes: { recipes: rows(views.recipes.recipes), unused: views.recipes.unused },
      utilities: { ...views.utilities, items: rows(views.utilities.items) },
      patterns: { ...views.patterns, items: rows(views.patterns.items) },
      keyframes: { ...views.keyframes, items: rows(views.keyframes.items) },
    },
  }
}
