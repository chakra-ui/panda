import { expect, it } from 'vitest'

import { createCompiler, loadWasm } from '../src'
import type { ExtractResult } from '../src'
import { baseConfig, describeIfBuilt, describeMissingWasm, withoutSpans } from './helpers'

describeIfBuilt('@pandacss/compiler-wasm extract', () => {
  it('extracts a css() call to a literal object', async () => {
    const compiler = await createCompiler(baseConfig)
    const raw = compiler.extractFileSource(
      '/src/code.tsx',
      `import { css } from '@panda/css';\ncss({ color: 'red', bg: 'blue' });\n`,
    )
    expect(withoutSpans(raw as ExtractResult)).toMatchInlineSnapshot(`
      {
        "calls": [
          {
            "category": "css",
            "name": "css",
            "alias": "css",
            "data": [
              {
                "color": "red",
                "bg": "blue",
              },
            ],
          },
        ],
        "jsx": [],
        "diagnostics": [],
      }
    `)
  })

  it('extracts a <styled.div> JSX usage', async () => {
    const compiler = await createCompiler(baseConfig)
    const raw = compiler.extractFileSource(
      '/src/code.tsx',
      `import { styled } from '@panda/jsx';\nconst X = () => <styled.div color="red" />;\n`,
    )
    expect(withoutSpans(raw as ExtractResult)).toMatchInlineSnapshot(`
      {
        "calls": [],
        "jsx": [
          {
            "category": "jsx",
            "kind": "factory",
            "name": "styled.div",
            "alias": "styled",
            "data": {
              "color": "red",
            },
          },
        ],
        "diagnostics": [],
      }
    `)
  })

  it('cross-file imports fold through the shared memory FS', async () => {
    const compiler = await createCompiler(baseConfig)
    compiler.fs!.addFile('/proj/tokens.ts', "export const brand = '#ef4444';\n")
    const raw = compiler.extractFileSource(
      '/proj/main.tsx',
      `import { brand } from './tokens';\nimport { css } from '@panda/css';\ncss({ color: brand });\n`,
    )
    expect(withoutSpans(raw as ExtractResult)).toMatchInlineSnapshot(`
      {
        "calls": [
          {
            "category": "css",
            "name": "css",
            "alias": "css",
            "data": [
              {
                "color": "#ef4444",
              },
            ],
          },
        ],
        "jsx": [],
        "diagnostics": [],
      }
    `)
  })

  it('extract reports parse-error diagnostics', async () => {
    const compiler = await createCompiler(baseConfig)
    const raw = compiler.extractFileSource(
      '/src/code.tsx',
      `import { css } from '@panda/css';\ncss({ color: }) // syntax error\n`,
    )
    const result = raw as ExtractResult
    // Just message + severity - exact text comes from oxc and isn't part
    // of our contract, but the shape should be stable.
    expect(result.diagnostics.map((d) => ({ severity: d.severity }))).toMatchInlineSnapshot(`
      [
        {
          "severity": "warning",
        },
      ]
    `)
  })

  it('throws on invalid matchers shape', async () => {
    const { WasmFileSystem, WasmExtractor } = await loadWasm()
    const fs = new WasmFileSystem()
    expect(() => new WasmExtractor(fs, 'not-an-object' as unknown)).toThrow()
  })
})

describeMissingWasm()
