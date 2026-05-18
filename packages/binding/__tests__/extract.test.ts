import { describe, expect, test } from 'vitest'
import { extract, extractDebug, type Matchers } from '../src'

const matchers: Matchers = {
  css: { modules: ['@panda/css'], names: ['css', 'cva', 'sva'] },
  recipe: { modules: ['@panda/recipes'] },
  pattern: { modules: ['@panda/patterns'] },
  jsx: { modules: ['@panda/jsx'], names: ['styled', 'Box'] },
  tokens: { modules: ['@panda/tokens'], names: ['token'] },
}

const source = [
  "import { css } from '@panda/css'",
  "import { Box } from '@panda/jsx'",
  "const a = css({ color: 'red' })",
  "const el = <Box fontSize='lg' />",
].join('\n')

describe('extract (lean)', () => {
  test('returns only calls + jsx + diagnostics', () => {
    const result = extract(source, 'fixture.tsx', matchers)
    expect(Object.keys(result).sort()).toMatchInlineSnapshot(`
      [
        "calls",
        "diagnostics",
        "jsx",
      ]
    `)
    expect({
      callNames: result.calls.map((c) => c.name),
      jsxNames: result.jsx.map((j) => j.name),
    }).toMatchInlineSnapshot(`
      {
        "callNames": [
          "css",
        ],
        "jsxNames": [
          "Box",
        ],
      }
    `)
  })

  test('surfaces parse errors with no extractions', () => {
    const result = extract('import { css } from', 'fixture.tsx', matchers)
    expect(result.calls).toEqual([])
    expect(result.jsx).toEqual([])
    expect(result.diagnostics).toHaveLength(1)
    expect(result.diagnostics[0].severity).toBe('error')
  })
})

describe('extractDebug', () => {
  test('returns full kitchen sink including imports + matched', () => {
    const result = extractDebug(source, 'fixture.tsx', matchers)
    expect({
      importModules: result.imports.map((i) => i.module),
      matchedNames: result.matched.map((m) => `${m.category}:${m.name}`),
      callNames: result.calls.map((c) => c.name),
      jsxNames: result.jsx.map((j) => j.name),
    }).toMatchInlineSnapshot(`
      {
        "importModules": [
          "@panda/css",
          "@panda/jsx",
        ],
        "matchedNames": [
          "css:css",
          "jsx:Box",
        ],
        "callNames": [
          "css",
        ],
        "jsxNames": [
          "Box",
        ],
      }
    `)
  })
})
