import { describe, expect, test } from 'vitest'
import { getBindingInfo } from '../src'
import { createProject } from './test-utils'

const compiler = createProject()

const source = [
  "import { css } from '@panda/css'",
  "import { Box } from '@panda/jsx'",
  "const a = css({ color: 'red' })",
  "const el = <Box fontSize='lg' />",
].join('\n')

describe('compiler.extract', () => {
  test('native binding is loaded', () => {
    expect(getBindingInfo()).toMatchInlineSnapshot(`
      {
        "native": true,
      }
    `)
  })

  test('returns calls + jsx + diagnostics', () => {
    const result = compiler.extract('fixture.tsx', source)
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

  test('is stateless — extract does not register into the compiler', () => {
    const peek = createProject()
    peek.extract('fixture.tsx', source)
    expect(peek.isEmpty()).toBe(true)
  })

  test('surfaces parse errors with no extractions', () => {
    const result = compiler.extract('fixture.tsx', 'import { css } from')
    expect(result.calls).toEqual([])
    expect(result.jsx).toEqual([])
    expect(result.diagnostics).toHaveLength(1)
    expect(result.diagnostics[0].severity).toBe('error')
  })

  test('diagnostics carry byte spans and line/column location', () => {
    // Parse error on the second line — confirm the diagnostic surfaces both
    // the byte span and the human-readable line/column.
    const src = ["import { css } from '@panda/css';", 'const x = ;'].join('\n')
    const [diag] = compiler.extract('fixture.tsx', src).diagnostics
    expect(diag.severity).toBe('error')
    expect(diag.span).toBeDefined()
    expect(diag.location?.start.line).toBe(2)
  })
})
