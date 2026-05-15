import { describe, expect, test } from 'vitest'
import { getBindingInfo, scanImports } from '../src'

describe('scanImports', () => {
  test('native binding is loaded', () => {
    expect(getBindingInfo()).toMatchInlineSnapshot(`
      {
        "native": true,
      }
    `)
  })

  test('extracts a single named import', () => {
    expect(scanImports("import { css as nCss } from '@panda/css'\n", 'fixture.tsx')).toMatchInlineSnapshot(`
      {
        "imports": [
          {
            "module": "@panda/css",
            "kind": "value",
            "typeOnly": false,
            "specifiers": [
              {
                "kind": "named",
                "imported": "css",
                "local": "nCss",
                "typeOnly": false,
                "span": {
                  "start": 9,
                  "end": 20,
                },
              },
            ],
            "span": {
              "start": 0,
              "end": 40,
            },
          },
        ],
        "diagnostics": [],
      }
    `)
  })

  test('reports parse errors', () => {
    const result = scanImports("import from 'broken';\n", 'fixture.tsx')
    expect(result.imports).toMatchInlineSnapshot('[]')
    expect(result.diagnostics.map((d) => d.severity)).toMatchInlineSnapshot(`
      [
        "error",
      ]
    `)
  })

  test('diagnostics include line/column location', () => {
    // Source with a parse error on the second line — confirm the diagnostic
    // surfaces both byte offsets (`span`) and human-readable line/column.
    const source = ["import { css } from '@panda/css';", 'const x = ;'].join('\n')
    const [diag] = scanImports(source, 'fixture.tsx').diagnostics
    expect({
      severity: diag.severity,
      span: diag.span,
      location: diag.location,
    }).toMatchInlineSnapshot(`
      {
        "severity": "error",
        "span": {
          "start": 44,
          "end": 45,
        },
        "location": {
          "start": {
            "line": 2,
            "column": 11,
          },
          "end": {
            "line": 2,
            "column": 12,
          },
        },
      }
    `)
  })
})
