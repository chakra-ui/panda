import { describe, expect, test } from 'vitest'
import { getBindingInfo, scanImports } from '../src'

describe('scanImports', () => {
  test('native binding is loaded', () => {
    expect(getBindingInfo()).toEqual({ native: true })
  })

  test('extracts a single named import', () => {
    expect(scanImports("import { css as nCss } from '@panda/css'\n", 'fixture.tsx')).toMatchInlineSnapshot(`
      {
        "diagnostics": [],
        "imports": [
          {
            "kind": "value",
            "module": "@panda/css",
            "span": {
              "end": 40,
              "start": 0,
            },
            "specifiers": [
              {
                "imported": "css",
                "kind": "named",
                "local": "nCss",
                "span": {
                  "end": 20,
                  "start": 9,
                },
                "typeOnly": false,
              },
            ],
            "typeOnly": false,
          },
        ],
      }
    `)
  })

  test('reports parse errors', () => {
    const result = scanImports("import from 'broken';\n", 'fixture.tsx')
    expect(result.imports).toEqual([])
    expect(result.diagnostics.length).toBe(1)
    expect(result.diagnostics[0].severity).toBe('error')
  })
})
