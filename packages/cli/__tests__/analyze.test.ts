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

    const result = await runAnalyze({ cwd: dir, logLevel: 'silent', scope: 'all' })

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
        "views": {
          "recipes": {
            "recipes": [],
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
          },
        },
      }
    `)
  })

  it('writes a static HTML report directory', async () => {
    dir = createFixture()
    writeFileSync(
      join(dir, 'App.tsx'),
      "import { css } from '@panda/css';\nimport { token } from '@panda/tokens';\ncss({ color: token('colors.red.500') })",
    )

    const reportDir = join(dir, 'analysis', 'panda-report')
    const result = await runAnalyze({ cwd: dir, logLevel: 'silent', scope: 'tokens', report: reportDir })

    expect(result.ok).toBe(true)
    expect(result.report).toBe(reportDir)
    expect(existsSync(join(reportDir, 'index.html'))).toBe(true)
    expect(existsSync(join(reportDir, 'data.json'))).toBe(true)

    const html = readFileSync(join(reportDir, 'index.html'), 'utf8')
    expect(html).toContain('<title>Panda analyze report</title>')
    expect(html).toContain('id="panda-analyze-data"')

    const payload = JSON.parse(readFileSync(join(reportDir, 'data.json'), 'utf8')) as AnalyzeReportPayload
    expect(payload.facts.files).toHaveLength(1)
    expect(payload.facts.tokenUsages).toHaveLength(1)
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
    const result = await runAnalyze({ cwd: dir, scope: 'all', limit: 1 }, { log: (message) => logs.push(message) })

    expect(result.ok).toBe(true)
    expect(logs.join('\n')).toMatchInlineSnapshot(`
      "analyze: scanned 1 files

      Summary
      tokens      1 uses, 1 unique
      recipes     1 uses, 1 unique
      utilities   1 uses, 1 unique
      patterns    0 uses, 0 unique
      keyframes   0 uses, 0 unique

      Tokens
      Category   Used           Top tokens    Raw values   Files
      colors     1/2 (50.00%)   red.500 (1)   0            1

      Recipes
      Recipe   Variants       Top variants   Files   Used as
      button   1/2 (50.00%)   size.sm (1)    1       jsx 100%, fn 0%"
    `)
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
}
