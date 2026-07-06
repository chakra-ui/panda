import { expect, it } from 'vitest'

import { createCompiler } from '../src'
import { baseConfig, describeIfBuilt, describeMissingWasm } from './helpers'

describeIfBuilt('@pandacss/compiler-wasm suggestTokens', () => {
  it('lists semantic tokens before matching primitives', async () => {
    const compiler = await createCompiler({
      ...baseConfig,
      theme: {
        tokens: { colors: { red: { 500: { value: '#f00' } } } },
        semanticTokens: { colors: { fg: { error: { value: '{colors.red.500}' } } } },
      },
      utilities: { color: { className: 'c', values: 'colors' } },
    })

    expect(compiler.suggestTokens('color', '#f00')).toMatchInlineSnapshot(`
      [
        {
          "token": "fg.error",
          "semantic": true,
          "conditional": false,
        },
        {
          "token": "red.500",
          "semantic": false,
          "conditional": false,
        },
      ]
    `)
  })

  it('lists semantic equivalents for primitive token paths', async () => {
    const compiler = await createCompiler({
      ...baseConfig,
      theme: {
        tokens: { colors: { red: { 500: { value: '#f00' } } }, spacing: { 4: { value: '1rem' } } },
        semanticTokens: { colors: { fg: { error: { value: '{colors.red.500}' } } } },
      },
    })

    expect({
      red: compiler.suggestSemanticTokens('colors.red.500'),
      spacing: compiler.suggestSemanticTokens('spacing.4'),
    }).toMatchInlineSnapshot(`
      {
        "red": [
          {
            "token": "fg.error",
            "semantic": true,
            "conditional": false,
          },
        ],
        "spacing": [],
      }
    `)
  })
})

describeMissingWasm()
