import { expect, test } from 'vitest'
import { TokenDictionary } from '../src/dictionary'
import { addNegativeTokens } from '../src/middleware'

test('middleware / add negative', () => {
  const dictionary = new TokenDictionary({
    hash: true,
    tokens: {
      spacing: {
        sm: { value: '4px' },
      },
    },
  })

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
          "rawValue": "4px",
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
          "rawValue": "calc(var(--jolVMp) * -1)",
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
