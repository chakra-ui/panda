import { expect, test } from 'vitest'
import { TokenDictionary } from '../src/dictionary'

test('semantic tokens / deeply nested', () => {
  const dictionary = new TokenDictionary({
    semanticTokens: {
      colors: {
        pink: { value: { base: '#fff', osDark: { highCon: 'sdfdfsd' } } },
      },
    },
  })

  dictionary.build()

  expect(dictionary.allTokens).toMatchInlineSnapshot(`
    [
      Token {
        "description": undefined,
        "extensions": {
          "category": "colors",
          "condition": "base",
          "conditions": {
            "base": "#fff",
            "osDark": {
              "highCon": "sdfdfsd",
            },
          },
          "prop": "pink",
          "rawPath": [
            "colors",
            "pink",
          ],
        },
        "name": "colors.pink",
        "originalValue": "#fff",
        "path": [
          "colors",
          "pink",
        ],
        "type": "color",
        "value": "#fff",
      },
      Token {
        "description": undefined,
        "extensions": {
          "category": "colors",
          "condition": "osDark:highCon",
          "conditions": {
            "base": "#fff",
            "osDark": {
              "highCon": "sdfdfsd",
            },
          },
          "prop": "pink",
          "rawPath": [
            "colors",
            "pink",
          ],
        },
        "name": "colors.pink",
        "originalValue": "#fff",
        "path": [
          "colors",
          "pink",
        ],
        "type": "color",
        "value": "sdfdfsd",
      },
    ]
  `)
})
