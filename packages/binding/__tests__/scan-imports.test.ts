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
})
