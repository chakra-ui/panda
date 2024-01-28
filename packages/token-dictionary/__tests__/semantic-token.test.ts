import { expect, test } from 'vitest'
import { TokenDictionary } from '../src/dictionary'
import { fixtureDefaults } from '@pandacss/fixture'

test('semantic tokens / deeply nested', () => {
  const dictionary = new TokenDictionary({
    semanticTokens: {
      colors: {
        pink: { value: { base: '#fff', osDark: { highCon: 'sdfdfsd' } } },
      },
    },
    logger: fixtureDefaults.logger,
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
