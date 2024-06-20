import { expect, test } from 'vitest'
import { TokenDictionary } from '../src/dictionary'

test('unknown token type', () => {
  const dictionary = new TokenDictionary({
    tokens: {
      filters: {
        blurry: {
          value: 'blur(5px)',
        },
      },
    },
  })

  dictionary.init()

  expect(dictionary.allTokens).toMatchInlineSnapshot(`
    [
      Token {
        "deprecated": undefined,
        "description": undefined,
        "extensions": {
          "category": "filters",
          "condition": "base",
          "prop": "blurry",
          "var": "--filters-blurry",
          "varRef": "var(--filters-blurry)",
        },
        "name": "filters.blurry",
        "originalValue": "blur(5px)",
        "path": [
          "filters",
          "blurry",
        ],
        "type": undefined,
        "value": "blur(5px)",
      },
    ]
  `)
  expect(dictionary.view.values).toMatchInlineSnapshot(`
    Map {
      "filters.blurry" => "var(--filters-blurry)",
    }
  `)
})
