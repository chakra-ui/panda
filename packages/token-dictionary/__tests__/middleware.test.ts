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

  dictionary.registerTokens()
  dictionary.registerMiddleware(addNegativeTokens)
  dictionary.build()

  expect(dictionary.allTokens).toMatchInlineSnapshot(`
    [
      Token {
        "deprecated": undefined,
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
        "deprecated": undefined,
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

test('negative tokens', () => {
  const dictionary = new TokenDictionary({
    tokens: {
      spacing: {
        1: { value: '1rem' },
      },
    },
    semanticTokens: {
      spacing: {
        lg: { value: '{spacing.1}' },
      },
    },
  })

  dictionary.registerTokens()
  dictionary.registerMiddleware(addNegativeTokens)
  dictionary.build()

  expect(dictionary.allTokens).toMatchInlineSnapshot(`
    [
      Token {
        "deprecated": undefined,
        "description": undefined,
        "extensions": {
          "category": "spacing",
          "condition": "base",
          "prop": "1",
        },
        "name": "spacing.1",
        "originalValue": "1rem",
        "path": [
          "spacing",
          "1",
        ],
        "type": "dimension",
        "value": "1rem",
      },
      Token {
        "deprecated": undefined,
        "description": undefined,
        "extensions": {
          "category": "spacing",
          "condition": "base",
          "conditions": {
            "base": "{spacing.1}",
          },
          "prop": "lg",
          "rawValue": {
            "base": "{spacing.1}",
          },
        },
        "name": "spacing.lg",
        "originalValue": "{spacing.1}",
        "path": [
          "spacing",
          "lg",
        ],
        "type": "dimension",
        "value": "1rem",
      },
      Token {
        "deprecated": undefined,
        "description": undefined,
        "extensions": {
          "category": "spacing",
          "condition": "base",
          "isNegative": true,
          "originalPath": [
            "spacing",
            "1",
          ],
          "prop": "-1",
        },
        "name": "spacing.-1",
        "originalValue": "1rem",
        "path": [
          "spacing",
          "-1",
        ],
        "type": "dimension",
        "value": "calc(var(--spacing-1) * -1)",
      },
      Token {
        "deprecated": undefined,
        "description": undefined,
        "extensions": {
          "category": "spacing",
          "condition": "base",
          "conditions": {
            "base": "{spacing.1}",
          },
          "isNegative": true,
          "originalPath": [
            "spacing",
            "lg",
          ],
          "prop": "-lg",
          "rawValue": {
            "base": "{spacing.1}",
          },
        },
        "name": "spacing.-lg",
        "originalValue": "{spacing.1}",
        "path": [
          "spacing",
          "-lg",
        ],
        "type": "dimension",
        "value": "calc(var(--spacing-lg) * -1)",
      },
    ]
  `)
  expect(dictionary.view.values).toMatchInlineSnapshot(`
    Map {
      "spacing.1" => undefined,
      "spacing.lg" => undefined,
      "spacing.-1" => "calc(var(--spacing-1) * -1)",
      "spacing.-lg" => "calc(var(--spacing-lg) * -1)",
    }
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

  dictionary.registerTokens()
  dictionary.registerMiddleware(addVirtualPalette)
  dictionary.build()

  expect(dictionary.allTokens).toMatchInlineSnapshot(`
    [
      Token {
        "deprecated": undefined,
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
