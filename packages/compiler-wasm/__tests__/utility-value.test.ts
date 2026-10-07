import { expect, it } from 'vitest'

import { createCompiler } from '../src'
import { baseConfig, describeIfBuilt } from './helpers'

describeIfBuilt('@pandacss/compiler-wasm resolveUtilityValue', () => {
  it('reports the tokens a negative spacing value references', async () => {
    const compiler = await createCompiler({
      ...baseConfig,
      theme: { tokens: { spacing: { 2: { value: '8px' } } } },
      utilities: { outlineOffset: { className: 'ring-o', values: 'spacing' } },
    })

    expect(compiler.resolveUtilityValue({ prop: 'outlineOffset', value: '-2' })).toMatchInlineSnapshot(`
      {
        "utility": "outlineOffset",
        "className": "ring-o_-2",
        "cssValue": "calc(var(--spacing-2) * -1)",
        "important": false,
        "source": {
          "type": "literal",
          "aliases": [],
        },
        "tokens": [
          "spacing.-2",
        ],
      }
    `)
    expect(compiler.resolveUtilityValue({ prop: 'outlineOffset', value: '[2px]' })?.tokens).toEqual([])
  })
})
