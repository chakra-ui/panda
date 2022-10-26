import { expect, test } from 'vitest'
import { TokenDictionary } from '../src/dictionary'

test('resolve aliases', () => {
  const dictionary = new TokenDictionary({
    tokens: {
      colors: {
        pink: { value: '#ff00ff' },
        border: { value: '{colors.pink}' },
        disabled: { value: '{colors.border}' },
      },
    },
  })

  dictionary.build()

  expect(dictionary.allTokens).toMatchInlineSnapshot(`
    [
      Token {
        "extensions": {
          "category": "colors",
          "condition": "base",
          "prop": "pink",
        },
        "name": "colors.pink",
        "originalValue": "#ff00ff",
        "path": [
          "colors",
          "pink",
        ],
        "type": "color",
        "value": "#ff00ff",
      },
      Token {
        "extensions": {
          "category": "colors",
          "condition": "base",
          "prop": "border",
        },
        "name": "colors.border",
        "originalValue": "{colors.pink}",
        "path": [
          "colors",
          "border",
        ],
        "type": "color",
        "value": "#ff00ff",
      },
      Token {
        "extensions": {
          "category": "colors",
          "condition": "base",
          "prop": "disabled",
        },
        "name": "colors.disabled",
        "originalValue": "{colors.border}",
        "path": [
          "colors",
          "disabled",
        ],
        "type": "color",
        "value": "#ff00ff",
      },
    ]
  `)
})
