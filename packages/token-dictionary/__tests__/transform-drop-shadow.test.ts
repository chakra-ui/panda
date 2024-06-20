import { expect, test } from 'vitest'
import { TokenDictionary } from '../src/dictionary'
import { transformDropShadow } from '../src/transform'

test('transform / dropShadow', () => {
  const dictionary = new TokenDictionary({
    tokens: {
      colors: {
        red: { value: '#ff0000' },
      },
      dropShadows: {
        sm: { value: { offsetX: 4, offsetY: 10, blur: 4, color: '{colors.red}' } },
        md: { value: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },
      },
    },
  })

  dictionary.registerTokens()
  dictionary.registerTransform(transformDropShadow)

  dictionary.build()

  expect(dictionary.allTokens).toMatchInlineSnapshot(`
    [
      Token {
        "deprecated": undefined,
        "description": undefined,
        "extensions": {
          "category": "colors",
          "condition": "base",
          "prop": "red",
        },
        "name": "colors.red",
        "originalValue": "#ff0000",
        "path": [
          "colors",
          "red",
        ],
        "type": "color",
        "value": "#ff0000",
      },
      Token {
        "deprecated": undefined,
        "description": undefined,
        "extensions": {
          "category": "dropShadows",
          "condition": "base",
          "prop": "sm",
        },
        "name": "dropShadows.sm",
        "originalValue": {
          "blur": 4,
          "color": "{colors.red}",
          "offsetX": 4,
          "offsetY": 10,
        },
        "path": [
          "dropShadows",
          "sm",
        ],
        "type": "dropShadow",
        "value": "drop-shadow(4px 10px 4px #ff0000)",
      },
      Token {
        "deprecated": undefined,
        "description": undefined,
        "extensions": {
          "category": "dropShadows",
          "condition": "base",
          "prop": "md",
        },
        "name": "dropShadows.md",
        "originalValue": "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        "path": [
          "dropShadows",
          "md",
        ],
        "type": "dropShadow",
        "value": "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      },
    ]
  `)
})
