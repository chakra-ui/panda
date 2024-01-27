import { expect, test } from 'vitest'
import { TokenDictionary } from '../src/dictionary'
import { addNegativeTokens, addVirtualPalette } from '../src/middleware'

test('middleware / add negative', () => {
  const dictionary = new TokenDictionary({
    hash: true,
    tokens: {
      spacing: {
        sm: { value: '4px' },
      },
    },
  })

  dictionary.setTokens()
  dictionary.registerMiddleware(addNegativeTokens)
  dictionary.build()

  expect(dictionary.allTokens).toMatchInlineSnapshot(`
    [
      Token {
        "description": undefined,
        "extensions": {
          "category": "spacing",
          "condition": "base",
          "prop": "sm",
        },
        "name": "spacing.sm",
        "originalValue": "4px",
        "path": [
          "spacing",
          "sm",
        ],
        "type": "dimension",
        "value": "4px",
      },
      Token {
        "description": undefined,
        "extensions": {
          "category": "spacing",
          "condition": "base",
          "isNegative": true,
          "originalPath": [
            "spacing",
            "sm",
          ],
          "prop": "-sm",
        },
        "name": "spacing.-sm",
        "originalValue": "4px",
        "path": [
          "spacing",
          "-sm",
        ],
        "type": "dimension",
        "value": "calc(var(--jolVMp) * -1)",
      },
    ]
  `)
})

test('middleware / formatTokenName', () => {
  const dictionary = new TokenDictionary({
    tokens: {
      colors: {
        red: {
          100: { value: '#FF0000' },
        },
      },
    },
  })

  dictionary.formatTokenName = (path) => `$${path.join('-')}`

  dictionary.setTokens()
  dictionary.registerMiddleware(addVirtualPalette)
  dictionary.build()

  expect(dictionary.allTokens).toMatchInlineSnapshot(`
    [
      Token {
        "description": undefined,
        "extensions": {
          "category": "colors",
          "condition": "base",
          "prop": "$red-100",
        },
        "name": "$colors-red-100",
        "originalValue": "#FF0000",
        "path": [
          "colors",
          "red",
          "100",
        ],
        "type": "color",
        "value": "#FF0000",
      },
    ]
  `)
})
