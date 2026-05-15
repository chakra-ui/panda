import { describe, expect, test } from 'vitest'
import { extract, type Matchers } from '../src'

const matchers: Matchers = {
  css: { modules: ['@panda/css'], names: ['css', 'cva', 'sva'] },
  recipe: { modules: ['@panda/recipes'] },
  pattern: { modules: ['@panda/patterns'] },
  jsx: { modules: ['@panda/jsx'], names: ['styled', 'Box'] },
  tokens: { modules: ['@panda/tokens'], names: ['token'] },
}

describe('extract (combined entrypoint)', () => {
  test('returns imports + matched + calls + jsx in one pass', () => {
    const source = [
      "import { css } from '@panda/css'",
      "import { Box } from '@panda/jsx'",
      "const a = css({ color: 'red' })",
      "const el = <Box fontSize='lg' />",
    ].join('\n')
    const result = extract(source, 'fixture.tsx', matchers)
    expect({
      matchedNames: result.matched.map((m) => `${m.category}:${m.name}`),
      callNames: result.calls.map((c) => c.name),
      jsxNames: result.jsx.map((j) => j.name),
    }).toMatchInlineSnapshot(`
      {
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

  test('surfaces parse errors with no extractions', () => {
    const result = extract('import { css } from', 'fixture.tsx', matchers)
    expect(result.calls).toEqual([])
    expect(result.jsx).toEqual([])
    expect(result.diagnostics).toHaveLength(1)
    expect(result.diagnostics[0].severity).toBe('error')
  })
})
