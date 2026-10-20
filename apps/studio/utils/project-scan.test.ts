import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { UsageReport } from '@pandacss/compiler-shared'
import { index, parseSpec } from './design-system'
import { attachSources, buildTree, isUsageReport, scanFromReport, summarizeScan, trimCommonRoot, type ProjectScan } from './project-scan'
import type { Finding } from './token-inspection'

const raw = readFileSync(new URL('../public/sample-design-system.json', import.meta.url), 'utf8')
const parsed = parseSpec(raw)
if (!parsed.ok) throw new Error(parsed.error)
const ds = index(parsed.spec)
const tokenNames = (category: string) => ds.view(category).map((t) => t.name)

const report = {
  sourceCount: 4,
  facts: {
    files: [
      { id: 0, path: '/repo/app/src/App.tsx', diagnostics: 0 },
      { id: 1, path: '/repo/app/src/components/Card.tsx', diagnostics: 0 },
    ],
    tokens: [
      { id: 0, path: 'colors.fg', category: 'colors', configured: true },
      { id: 1, path: 'colors.fg.mutd', category: 'colors', configured: false },
      { id: 2, path: 'spacing.4', category: 'spacing', configured: true },
    ],
    tokenUsages: [
      { fileId: 0, tokenId: 0, line: 3, column: 10 },
      { fileId: 0, tokenId: 2, line: 2, column: 4 },
      { fileId: 1, tokenId: 0, line: 5, column: 12 },
      { fileId: 1, tokenId: 1, line: 6, column: 12 },
    ],
    rawValues: [{ id: 0, prop: 'color', value: '#fff', category: 'colors' }],
    rawValueUsages: [{ fileId: 1, rawValueId: 0, line: 8, column: 9 }],
    rawValueSuggestions: [{ rawValueId: 0, token: 'white', semantic: false, conditional: false }],
    recipes: [],
    recipeUsages: [],
    recipeVariantUsages: [],
  },
} as unknown as UsageReport

const describeFinding = (f: Finding) =>
  `${f.line} ${f.kind} ${f.value}${f.kind === 'unknown' && f.suggestion ? ` → ${f.suggestion}` : ''}${f.kind === 'raw' && f.match ? ` → ${f.match}` : ''}`

describe('trimCommonRoot', () => {
  it('starts paths where the project does', () => {
    const trim = trimCommonRoot(['app/src/App.tsx', 'app/src/components/Card.tsx'])
    expect(trim('app/src/components/Card.tsx')).toBe('components/Card.tsx')
  })

  it('keeps the folder name of a single file', () => {
    expect(trimCommonRoot(['src/App.tsx'])('src/App.tsx')).toBe('App.tsx')
  })
})

describe('scanFromReport', () => {
  it('recognizes a panda analyze report', () => {
    expect(isUsageReport(report)).toBe(true)
    expect(isUsageReport(parsed.ok && parsed.spec)).toBe(false)
  })

  it('turns report facts into per-file findings, in line order', () => {
    const scan = scanFromReport(report, tokenNames)
    expect(scan.files.map((f) => [f.path, f.findings.map(describeFinding)])).toMatchInlineSnapshot(`
      [
        [
          "App.tsx",
          [
            "2 token 4",
            "3 token fg",
          ],
        ],
        [
          "components/Card.tsx",
          [
            "5 token fg",
            "6 unknown fg.mutd → fg.muted",
            "8 raw #fff → white",
          ],
        ],
      ]
    `)
  })
})

describe('summarizeScan', () => {
  it('counts token uses and collects issues across files', () => {
    const scan = scanFromReport(report, tokenNames)
    const summary = summarizeScan(scan, ds, ['colors', 'spacing'])
    expect({
      used: summary.used,
      top: summary.top.map((t) => `${t.path} ×${t.uses}`),
      issues: summary.issues.map((i) => `${i.file}:${i.line} ${i.value}`),
      unknown: summary.unknown,
      raw: summary.raw,
    }).toMatchInlineSnapshot(`
      {
        "issues": [
          "components/Card.tsx:6 fg.mutd",
          "components/Card.tsx:8 #fff",
        ],
        "raw": 1,
        "top": [
          "colors.fg ×2",
          "spacing.4 ×1",
        ],
        "unknown": 1,
        "used": 2,
      }
    `)
  })
})

describe('attachSources', () => {
  it('shows a report file with its code, marking the values the CLI found', () => {
    const scan = scanFromReport(report, tokenNames)
    const card = [
      "import { css } from 'styled-system/css'",
      '',
      'export const card = css({',
      '  p: 4,',
      "  color: 'fg',",
      "  bg: 'fg.mutd',",
      '  rounded: 12,',
      "  borderColor: '#fff',",
      '})',
    ].join('\n')
    const attached = attachSources(scan, [
      { path: 'my-app/src/components/Card.tsx', text: card },
      { path: 'my-app/src/other/Card.tsx', text: 'nope' },
    ])
    const file = attached.files.find((f) => f.path === 'components/Card.tsx')!
    expect(file.findings.map((f) => `${f.line} ${card.slice(f.from, f.to)}`)).toMatchInlineSnapshot(`
      [
        "5 fg",
        "6 fg.mutd",
        "8 #fff",
      ]
    `)
    expect(attached.files.find((f) => f.path === 'App.tsx')?.source).toBeUndefined()
  })
})

describe('buildTree', () => {
  it('nests files under folders, folders first, with issue counts rolled up', () => {
    const scan: ProjectScan = scanFromReport(report, tokenNames)
    const tree = buildTree(scan.files)
    const lines: string[] = []
    const walk = (nodes: typeof tree, depth: number) => {
      for (const node of nodes) {
        lines.push(`${'  '.repeat(depth)}${node.name}${node.issues ? ` (${node.issues})` : ''}`)
        walk(node.children, depth + 1)
      }
    }
    walk(tree, 0)
    expect(lines).toMatchInlineSnapshot(`
      [
        "components (2)",
        "  Card.tsx (2)",
        "App.tsx",
      ]
    `)
  })
})
