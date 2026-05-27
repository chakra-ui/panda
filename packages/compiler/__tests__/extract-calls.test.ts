import { describe, expect, test } from 'vitest'
import { createProject } from './test-utils'

const compiler = createProject()

function pipeline(source: string) {
  const { calls, diagnostics } = compiler.extract(source, 'fixture.tsx')
  return { calls, diagnostics }
}

describe('compiler.extract → calls', () => {
  test('full pipeline: scan → match → extract', () => {
    const source = [
      "import { css as nCss } from '@panda/css'",
      "const a = nCss({ color: 'red', fontSize: 12 })",
      '',
    ].join('\n')
    expect(pipeline(source)).toMatchInlineSnapshot(`
      {
        "calls": [
          {
            "category": "css",
            "name": "css",
            "alias": "nCss",
            "data": [
              {
                "kind": "value",
                "value": {
                  "color": "red",
                  "fontSize": 12,
                },
              },
            ],
            "span": {
              "start": 51,
              "end": 87,
            },
          },
        ],
        "diagnostics": [],
      }
    `)
  })

  test('preserves object-property insertion order', () => {
    const result = pipeline("import { css } from '@panda/css'; css({ z: 1, a: 2, m: 3 })")
    expect(result.calls[0].data).toMatchInlineSnapshot(`
      [
        {
          "kind": "value",
          "value": {
            "z": 1,
            "a": 2,
            "m": 3,
          },
        },
      ]
    `)
  })

  test('ignores calls whose callee is not a matched binding', () => {
    const result = pipeline("import { css } from '@panda/css'\nunrelated({ color: 'red' })\ncss({ color: 'blue' })")
    expect(result.calls.map((c) => c.data)).toMatchInlineSnapshot(`
      [
        [
          {
            "kind": "value",
            "value": {
              "color": "blue",
            },
          },
        ],
      ]
    `)
  })

  test('namespace callee: panda.css / panda.cva / panda.sva', () => {
    const source = [
      "import * as panda from '@panda/css'",
      "panda.css({ color: 'red' })",
      "panda.cva({ base: { color: 'blue' } })",
      "panda.sva({ base: { root: { color: 'green' } } })",
      '',
    ].join('\n')
    expect(pipeline(source).calls).toMatchInlineSnapshot(`
      [
        {
          "category": "css",
          "name": "css",
          "alias": "panda",
          "data": [
            {
              "kind": "value",
              "value": {
                "color": "red",
              },
            },
          ],
          "span": {
            "start": 36,
            "end": 63,
          },
        },
        {
          "category": "css",
          "name": "cva",
          "alias": "panda",
          "data": [
            {
              "kind": "value",
              "value": {
                "base": {
                  "color": "blue",
                },
              },
            },
          ],
          "span": {
            "start": 64,
            "end": 102,
          },
        },
        {
          "category": "css",
          "name": "sva",
          "alias": "panda",
          "data": [
            {
              "kind": "value",
              "value": {
                "base": {
                  "root": {
                    "color": "green",
                  },
                },
              },
            },
          ],
          "span": {
            "start": 103,
            "end": 152,
          },
        },
      ]
    `)
  })

  test('namespace callee outside name allowlist is skipped', () => {
    const result = pipeline("import * as panda from '@panda/css'\npanda.somethingElse({ color: 'red' })")
    expect(result.calls).toMatchInlineSnapshot(`[]`)
  })

  test('multi-arg call extracts all literal arguments', () => {
    const source = ["import { styled } from '@panda/jsx'", "styled('div', { base: { color: 'red' } })", ''].join('\n')
    expect(pipeline(source).calls[0].data).toMatchInlineSnapshot(`
      [
        {
          "kind": "value",
          "value": "div",
        },
        {
          "kind": "value",
          "value": {
            "base": {
              "color": "red",
            },
          },
        },
      ]
    `)
  })
})
