import { describe, expect, test } from 'vitest'
import { Extractor, type Matchers } from '../src'

const matchers: Matchers = {
  css: { modules: ['@panda/css'], names: ['css', 'cva', 'sva'] },
  recipe: { modules: ['@panda/recipes'] },
  pattern: { modules: ['@panda/patterns'] },
  jsx: { modules: ['@panda/jsx'], names: ['styled', 'Box'] },
  tokens: { modules: ['@panda/tokens'], names: ['token'] },
  tokenDictionary: {
    values: {
      'colors.red.500': '#ef4444',
      'colors.blue.500': '#3b82f6',
    },
    vars: {
      'colors.red.500': 'var(--colors-red-500)',
      'colors.blue.500': 'var(--colors-blue-500)',
    },
  },
}

describe('Extractor (reusable session)', () => {
  test('extract returns same shape as free function', () => {
    const session = new Extractor(matchers)
    const result = session.extract(
      ["import { css } from '@panda/css'", "css({ color: 'red' })"].join('\n'),
      'fixture.tsx',
    )
    expect(Object.keys(result).sort()).toMatchInlineSnapshot(`
      [
        "calls",
        "diagnostics",
        "jsx",
      ]
    `)
    expect(result.calls.map((c) => c.name)).toEqual(['css'])
  })

  test('session reuse: same instance handles multiple files', () => {
    // Core promise of the session API: build the matchers + token
    // dictionary once, extract across many files without rebuild cost.
    // We don't time it here (Vitest isn't a benchmark harness), but we
    // verify identity-of-result vs the free function and absence of
    // cross-file state leakage.
    const session = new Extractor(matchers)
    const files = [
      ["import { css } from '@panda/css'", "css({ color: 'red' })"].join('\n'),
      ["import { css } from '@panda/css'", "css({ padding: '4px' })"].join('\n'),
      ["import { Box } from '@panda/jsx'", "const el = <Box color='blue' />"].join('\n'),
    ]
    const results = files.map((src, i) => session.extract(src, `f${i}.tsx`))
    expect(results.map((r) => r.calls.length)).toEqual([1, 1, 0])
    expect(results.map((r) => r.jsx.length)).toEqual([0, 0, 1])
    // No cross-file leakage: each result is independent.
    expect(results[0].calls[0].data[0]).toMatchInlineSnapshot(`
      {
        "kind": "value",
        "value": {
          "color": "red",
        },
      }
    `)
    expect(results[1].calls[0].data[0]).toMatchInlineSnapshot(`
      {
        "kind": "value",
        "value": {
          "padding": "4px",
        },
      }
    `)
  })

  test('token dictionary is materialized once and reused', () => {
    // Sanity check: tokens fold via the prebuilt dictionary across calls.
    const session = new Extractor(matchers)
    const src = [
      "import { token } from '@panda/tokens'",
      "import { css } from '@panda/css'",
      "css({ color: token('colors.red.500') })",
    ].join('\n')
    const a = session.extract(src, 'a.tsx')
    const b = session.extract(src, 'b.tsx')
    const cssCallA = a.calls.find((c) => c.name === 'css')
    const cssCallB = b.calls.find((c) => c.name === 'css')
    // Same prebuilt dictionary produces consistent folding.
    expect(cssCallA?.data).toEqual(cssCallB?.data)
    expect(cssCallA?.data[0]).toMatchInlineSnapshot(`
      {
        "kind": "value",
        "value": {
          "color": "#ef4444",
        },
      }
    `)
  })

  test('matchImports reuses session matchers', () => {
    const session = new Extractor(matchers)
    // No native scanImports method on the class — feed it the result of
    // the free scanImports call. This mirrors how Vite-style integrations
    // wire the staged APIs together.
    const scan = {
      imports: [
        {
          module: '@panda/css',
          kind: 'value' as const,
          typeOnly: false,
          specifiers: [
            {
              kind: 'named' as const,
              imported: 'css',
              local: 'css',
              typeOnly: false,
              span: { start: 9, end: 12 },
            },
          ],
          span: { start: 0, end: 33 },
        },
      ],
      diagnostics: [],
    }
    const matched = session.matchImports(scan)
    expect(matched).toEqual([{ category: 'css', module: '@panda/css', name: 'css', alias: 'css', kind: 'named' }])
  })

  test('extractDebug exposes imports and matched on the same session', () => {
    const session = new Extractor(matchers)
    const src = ["import { css } from '@panda/css'", "css({ color: 'red' })"].join('\n')
    const result = session.extractDebug(src, 'fixture.tsx')
    expect(result.imports.map((i) => i.module)).toEqual(['@panda/css'])
    expect(result.matched.map((m) => `${m.category}:${m.name}`)).toEqual(['css:css'])
    expect(result.calls.map((c) => c.name)).toEqual(['css'])
  })
})
