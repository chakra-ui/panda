import { describe, expect, test } from 'vitest'
import { createSemanticTokenFn } from '../src/semantic-token-fn'

describe('Semantic tokens', () => {
  test('should transform nested', () => {
    const result = new Set()

    const each = createSemanticTokenFn({
      button: {
        text: { h1: { mid: { base: '10px', dark: '30px' } } },
      },
    })

    each((data) => {
      result.add(data)
    })

    expect(result).toMatchInlineSnapshot(`
      Set {
        {
          "category": "button",
          "condition": "base",
          "key": "text.h1.mid",
          "negative": false,
          "prop": "button.text.h1.mid",
          "value": "10px",
          "var": "--button-text-h1-mid",
          "varRef": "var(--button-text-h1-mid)",
        },
        {
          "category": "button",
          "condition": "dark",
          "key": "text.h1.mid",
          "negative": false,
          "prop": "button.text.h1.mid",
          "value": "30px",
          "var": "--button-text-h1-mid",
          "varRef": "var(--button-text-h1-mid)",
        },
      }
    `)
  })
})
