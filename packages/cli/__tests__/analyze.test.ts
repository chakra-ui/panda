import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runAnalyze } from '../src'
import { createFixture, cleanupFixture } from './helpers'

describe('cli analyze', () => {
  let dir: string | undefined

  afterEach(() => {
    cleanupFixture(dir)
    dir = undefined
  })

  it('analyzes token and keyframe usage across sources', async () => {
    dir = createFixture()
    writeFileSync(
      join(dir, 'App.tsx'),
      "import { css } from '@panda/css';\nimport { token } from '@panda/tokens';\ncss({ color: token('colors.red.500'), animationName: 'spin' })",
    )

    const result = await runAnalyze({ cwd: dir, logLevel: 'silent' })

    expect(result.ok).toBe(true)
    expect(result.scope).toBe('all')
    expect(result.sourceCount).toBe(1)
    expect(result.summary.tokens.used).toBeGreaterThan(0)
    expect(result.summary.keyframes.used).toBeGreaterThanOrEqual(0)
    expect(result.files).toHaveLength(1)
    expect(result.files[0]).toMatchObject({
      path: expect.stringContaining('App.tsx'),
      counts: { tokens: expect.any(Number), keyframes: expect.any(Number) },
    })
  })

  it('writes the JSON report for a scope and creates output directories', async () => {
    dir = createFixture()
    writeFileSync(
      join(dir, 'App.tsx'),
      "import { css } from '@panda/css';\nimport { token } from '@panda/tokens';\ncss({ color: token('colors.red.500') })",
    )

    const outfile = join(dir, 'analysis', 'panda-analysis.json')
    const result = await runAnalyze({ cwd: dir, logLevel: 'silent', scope: 'tokens', outfile })

    expect(result.ok).toBe(true)
    expect(result.scope).toBe('tokens')
    expect(existsSync(outfile)).toBe(true)

    const payload = JSON.parse(readFileSync(outfile, 'utf8')) as AnalyzeReportPayload
    const normalized = {
      ...payload,
      facts: {
        ...payload.facts,
        files: payload.facts.files.map((file) => ({ ...file, path: file.path.replace(dir!, '<fixture>') })),
      },
      files: payload.files.map((file) => ({ ...file, path: file.path.replace(dir!, '<fixture>') })),
      usages: payload.usages.map((usage) => ({ ...usage, file: usage.file.replace(dir!, '<fixture>') })),
    }

    expect(normalized).toMatchInlineSnapshot(`
      {
        "facts": {
          "files": [
            {
              "diagnostics": 1,
              "id": 0,
              "path": "<fixture>/App.tsx",
            },
          ],
          "rawValueSuggestions": [],
          "rawValueUsages": [],
          "rawValues": [],
          "recipeUsages": [],
          "recipeVariantUsages": [],
          "recipes": [],
          "tokenUsages": [
            {
              "column": 14,
              "fileId": 0,
              "line": 3,
              "tokenId": 0,
            },
          ],
          "tokens": [
            {
              "category": "colors",
              "configured": false,
              "id": 0,
              "path": "colors.red.500",
            },
          ],
        },
        "files": [
          {
            "counts": {
              "compositions": 0,
              "keyframes": 0,
              "patterns": 0,
              "recipes": 0,
              "tokens": 1,
              "utilities": 0,
            },
            "diagnostics": 1,
            "path": "<fixture>/App.tsx",
            "sourceUsages": 1,
          },
        ],
        "scope": "tokens",
        "sourceCount": 1,
        "sourceUsages": 1,
        "summary": {
          "compositions": {
            "total": 0,
            "unique": 0,
            "used": 0,
          },
          "keyframes": {
            "total": 0,
            "unique": 0,
            "used": 0,
          },
          "patterns": {
            "total": 0,
            "unique": 0,
            "used": 0,
          },
          "recipes": {
            "total": 0,
            "unique": 0,
            "used": 0,
          },
          "tokens": {
            "total": 0,
            "unique": 1,
            "used": 1,
          },
          "utilities": {
            "total": 0,
            "unique": 0,
            "used": 0,
          },
        },
        "usages": [
          {
            "column": 14,
            "file": "<fixture>/App.tsx",
            "kind": "token",
            "line": 3,
            "name": "colors.red.500",
          },
        ],
        "views": {
          "compositions": {
            "items": [],
            "percentUsed": 0,
            "total": 0,
            "unused": [],
            "used": 0,
          },
          "keyframes": {
            "items": [],
            "percentUsed": 0,
            "total": 0,
            "unused": [],
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
            "recipes": [],
            "unused": [],
          },
          "tokens": {
            "categories": [
              {
                "category": "colors",
                "files": 1,
                "percentUsed": 100,
                "rawValues": [],
                "top": [
                  {
                    "files": 1,
                    "name": "red.500",
                    "uses": 1,
                  },
                ],
                "total": 1,
                "unused": 0,
                "used": 1,
              },
            ],
            "unused": [],
          },
          "utilities": {
            "items": [],
            "percentUsed": 0,
            "total": 0,
            "unused": [],
            "used": 0,
          },
        },
      }
    `)
  })

  it('prints ranked utilities, patterns, and keyframes with what the config declares but nobody uses', async () => {
    dir = createFixture(
      `export default {
        outdir: 'styled-system',
        include: ['**/*.tsx'],
        importMap: {
          css: ['@panda/css'],
          pattern: ['@panda/patterns'],
        },
        theme: {
          tokens: {
            colors: { red: { 500: { value: '#f00' } } },
            spacing: { 4: { value: '1rem' } },
          },
          keyframes: {
            spin: { to: { transform: 'rotate(360deg)' } },
            pulse: { to: { opacity: 0.5 } },
          },
        },
        patterns: {
          stack: { transform: (props) => props },
          hstack: { transform: (props) => props },
        },
        utilities: {
          color: { className: 'c', values: 'colors' },
          padding: { className: 'p', shorthand: 'p', values: 'spacing' },
          margin: { className: 'm', values: 'spacing' },
        },
      }`,
      { source: false },
    )
    writeFileSync(
      join(dir, 'App.tsx'),
      [
        "import { css } from '@panda/css'",
        "import { stack } from '@panda/patterns'",
        "css({ color: 'red.500', p: '4', padding: '4', animationName: 'spin' })",
        "stack({ gap: '4' })",
      ].join('\n'),
    )

    const logs: string[] = []
    await runAnalyze({ cwd: dir }, { log: (message) => logs.push(message) })

    expect(logs.join('\n')).toMatchInlineSnapshot(`
      "analyze: scanned 1 files

      Summary
      tokens         3 uses, 2 unique
      recipes        0 uses, 0 unique
      utilities      3 uses, 2 unique
      patterns       1 uses, 1 unique
      keyframes      1 uses, 1 unique
      compositions   0 uses, 0 unique

      Tokens
      Category   Used            Top tokens    Raw values   Files
      colors     1/1 (100.00%)   red.500 (1)   0            1
      spacing    1/1 (100.00%)   4 (2)         0            1

      No config recipes used

      Utilities   2/4 used (50.00%)
      Utility   Uses   Used in
      padding   2      1 file
      color     1      1 file
      Unused (2): colorPalette, margin

      Patterns   1/2 used (50.00%)
      Pattern   Uses   Used in
      stack     1      1 file
      Unused (1): hstack

      Keyframes   1/2 used (50.00%)
      Keyframe   Uses   Used in
      spin       1      1 file
      Unused (1): pulse

      No compositions found"
    `)

    logs.length = 0
    await runAnalyze({ cwd: dir, scope: 'keyframes' }, { log: (message) => logs.push(message) })

    expect(logs.join('\n')).toMatchInlineSnapshot(`
      "analyze: scanned 1 files

      Keyframes   1/2 used (50.00%)
      Keyframe   Uses   Used in
      spin       1      1 file
      Unused (1): pulse"
    `)
  })

  it('lists only what nobody uses, one name per line, with --unused', async () => {
    dir = createFixture(
      `export default {
        outdir: 'styled-system',
        include: ['**/*.tsx'],
        importMap: { css: ['@panda/css'] },
        theme: {
          tokens: { colors: { red: { 500: { value: '#f00' } }, blue: { 500: { value: '#00f' } } } },
          keyframes: { spin: { to: { transform: 'rotate(360deg)' } }, pulse: { to: { opacity: 0.5 } } },
          recipes: { badge: { base: { color: 'red.500' } } },
        },
        patterns: { stack: { transform: (props) => props } },
        utilities: {
          color: { className: 'c', values: 'colors' },
          margin: { className: 'm', values: 'spacing' },
        },
      }`,
      { source: false },
    )
    writeFileSync(
      join(dir, 'App.tsx'),
      "import { css } from '@panda/css'\ncss({ color: 'red.500', animationName: 'spin' })",
    )

    const logs: string[] = []
    await runAnalyze({ cwd: dir, unused: true }, { log: (message) => logs.push(message) })

    expect(logs.join('\n')).toMatchInlineSnapshot(`
      "analyze: scanned 1 files
      Unused

      Tokens (1)
      colors.blue.500

      Recipes (1)
      badge

      Utilities (2)
      colorPalette
      margin

      Patterns (1)
      stack

      Keyframes (1)
      pulse

      Compositions (0)"
    `)

    logs.length = 0
    await runAnalyze({ cwd: dir, unused: true, scope: 'keyframes' }, { log: (message) => logs.push(message) })

    expect(logs).toEqual(['pulse'])
  })

  it('prints a bounded token and recipe report', async () => {
    dir = createFixture(
      `export default {
        jsxFramework: 'react',
        outdir: 'styled-system',
        include: ['**/*.tsx'],
        importMap: {
          css: ['@panda/css'],
          jsx: ['@panda/jsx'],
          tokens: ['@panda/tokens'],
        },
        theme: {
          tokens: {
            colors: {
              red: { 500: { value: '#f00' } },
              blue: { 500: { value: '#00f' } },
            },
          },
          recipes: {
            button: {
              jsx: ['Button'],
              base: {},
              variants: {
                size: {
                  sm: { color: 'red.500' },
                  md: { color: 'blue.500' },
                },
              },
            },
          },
        },
        utilities: {
          color: { className: 'c', values: 'colors' },
        },
      }`,
      { source: false },
    )
    writeFileSync(
      join(dir, 'App.tsx'),
      [
        "import { css } from '@panda/css'",
        "import { token } from '@panda/tokens'",
        "import { Button } from '@panda/jsx'",
        "css({ color: token('colors.red.500') })",
        ';<Button size="sm" />',
      ].join('\n'),
    )

    const logs: string[] = []
    const result = await runAnalyze({ cwd: dir, limit: 1 }, { log: (message) => logs.push(message) })

    expect(result.ok).toBe(true)
    expect(logs.join('\n')).toMatchInlineSnapshot(`
      "analyze: scanned 1 files

      Summary
      tokens         2 uses, 1 unique
      recipes        1 uses, 1 unique
      utilities      2 uses, 1 unique
      patterns       0 uses, 0 unique
      keyframes      0 uses, 0 unique
      compositions   0 uses, 0 unique

      Tokens
      Category   Used           Top tokens    Raw values   Files
      colors     1/2 (50.00%)   red.500 (2)   0            1

      Recipes
      Recipe   Variants       Top variants   Used in   Used as
      button   1/2 (50.00%)   size.sm (1)    1 file    jsx 100%, fn 0%

      Utilities   1/2 used (50.00%)
      Utility   Uses   Used in
      color     2      1 file, recipes.button
      Unused (1): colorPalette

      No patterns found

      No keyframes found

      No compositions found"
    `)
  })

  it('counts styles used from config, with the place that uses them, without adding source sites', async () => {
    dir = createFixture(
      `export default {
        outdir: 'styled-system',
        include: ['**/*.tsx'],
        theme: {
          tokens: { colors: { brand: { value: '#f00' } } },
          keyframes: {
            globalMotion: { to: { opacity: 0 } },
            staticMotion: { to: { opacity: 0 } },
            recipeMotion: { to: { opacity: 0 } },
            unusedMotion: { to: { opacity: 0 } },
          },
          recipes: {
            badge: { base: { animationName: 'recipeMotion' } },
            unusedRecipe: { base: { animationName: 'unusedMotion' } },
          },
        },
        utilities: {
          color: { className: 'c', values: 'colors' },
          animationName: { className: 'anim-name', values: 'keyframes' },
        },
        globalCss: { body: { color: 'brand', animationName: 'globalMotion' } },
        staticCss: {
          css: [{ properties: { animationName: ['staticMotion'] } }],
          recipes: { badge: [{}] },
        },
      }`,
      { source: false },
    )

    const logs: string[] = []
    const result = await runAnalyze({ cwd: dir, scope: 'keyframes', unused: true }, { log: (line) => logs.push(line) })

    expect(result.ok).toBe(true)
    expect(logs).toEqual(['unusedMotion'])
    expect(result.sourceCount).toBe(0)
    expect(result.sourceUsages).toBe(0)
    expect(result.summary.keyframes.used).toBe(3)
    expect(result.usages).toEqual([])
    expect(result.files).toEqual([])
    expect(result.views?.keyframes.items).toMatchInlineSnapshot(`
      [
        {
          "config": [
            "globalCss",
          ],
          "files": 0,
          "name": "globalMotion",
          "uses": 1,
        },
        {
          "config": [
            "staticCss.recipes.badge",
          ],
          "files": 0,
          "name": "recipeMotion",
          "uses": 1,
        },
        {
          "config": [
            "staticCss.css",
          ],
          "files": 0,
          "name": "staticMotion",
          "uses": 1,
        },
      ]
    `)

    logs.length = 0
    await runAnalyze({ cwd: dir, scope: 'keyframes', limit: 1 }, { log: (line) => logs.push(line) })
    expect(logs.join('\n')).toMatchInlineSnapshot(`
      "analyze: scanned 0 files

      Keyframes   3/4 used (75.00%)
      Keyframe       Uses   Used in
      globalMotion   1      globalCss
      Unused (1): unusedMotion"
    `)

    const all = await runAnalyze({ cwd: dir, logLevel: 'silent' })
    expect(all.views?.tokens.unused).not.toContain('colors.brand')
    expect(all.views?.utilities.unused).not.toContain('animationName')
    expect(all.views?.recipes.unused).toEqual(['unusedRecipe'])
  })

  it('reports compositions and lists where a utility is used, keeping the first few places', async () => {
    dir = createFixture(
      `export default {
        outdir: 'styled-system',
        include: ['**/*.tsx'],
        importMap: { css: ['@panda/css'] },
        globalCss: { body: { color: 'red.500', textStyle: 'lead' } },
        staticCss: { css: [{ properties: { color: ['red.500'] } }] },
        theme: {
          tokens: { colors: { red: { 500: { value: '#f00' } } } },
          textStyles: {
            lead: { value: { color: 'red.500' } },
            unused: { value: { fontSize: '10px' } },
          },
        },
        utilities: { color: { className: 'c', values: 'colors' } },
      }`,
      { source: false },
    )
    writeFileSync(join(dir, 'A.tsx'), "import { css } from '@panda/css'\ncss({ color: 'red.500' })")
    writeFileSync(join(dir, 'B.tsx'), "import { css } from '@panda/css'\ncss({ color: 'red.500' })")

    const logs: string[] = []
    const log = (message: string) => logs.push(message)

    await runAnalyze({ cwd: dir, scope: 'compositions' }, { log })
    const compositions = logs.join('\n')

    logs.length = 0
    await runAnalyze({ cwd: dir, scope: 'utilities' }, { log })
    const utilities = logs.join('\n')

    logs.length = 0
    await runAnalyze({ cwd: dir, unused: true, scope: 'compositions' }, { log })

    expect(compositions).toMatchInlineSnapshot(`
      "analyze: scanned 2 files

      Compositions   1/2 used (50.00%)
      Composition       Uses   Used in
      textStyles.lead   1      globalCss
      Unused (1): textStyles.unused"
    `)
    expect(utilities).toMatchInlineSnapshot(`
      "analyze: scanned 2 files

      Utilities   2/3 used (66.67%)
      Utility     Uses   Used in
      color       5      2 files, globalCss, staticCss.css, +1 more
      textStyle   1      globalCss
      Unused (1): colorPalette"
    `)
    expect(logs).toEqual(['textStyles.unused'])
  })
})

interface AnalyzeReportPayload {
  sourceCount: number
  scope: string
  sourceUsages: number
  summary: Record<string, { used: number; unique: number }>
  facts: {
    files: Array<{ id: number; path: string; diagnostics: number }>
    tokens: Array<{ id: number; path: string; category: string }>
    tokenUsages: Array<{ fileId: number; tokenId: number; line: number; column: number }>
    rawValues: unknown[]
    rawValueUsages: unknown[]
    rawValueSuggestions: unknown[]
    recipes: unknown[]
    recipeUsages: unknown[]
    recipeVariantUsages: unknown[]
  }
  views?: unknown
  files: Array<{
    path: string
    counts: Record<string, number>
    diagnostics: number
    sourceUsages: number
  }>
  usages: Array<{ kind: string; name: string; file: string; line: number; column: number }>
}
