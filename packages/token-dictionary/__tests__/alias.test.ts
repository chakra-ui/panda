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
        "description": undefined,
        "extensions": {
          "category": "colors",
          "condition": "base",
          "prop": "pink",
          "rawValue": "#ff00ff",
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
        "description": undefined,
        "extensions": {
          "category": "colors",
          "condition": "base",
          "prop": "border",
          "rawValue": "#ff00ff",
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
        "description": undefined,
        "extensions": {
          "category": "colors",
          "condition": "base",
          "prop": "disabled",
          "rawValue": "#ff00ff",
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
