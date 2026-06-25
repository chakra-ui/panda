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
})

describeMissingWasm()
