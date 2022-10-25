import { expect, test } from 'vitest'
import { TokenDictionary } from '../src/dictionary'
import { addNegativeTokens } from '../src/middleware'

test('should add negative spacing', () => {
  const dictionary = new TokenDictionary({
    tokens: {
      spacing: {
        sm: { value: '40px' },
      },
    },
  })

  addNegativeTokens(dictionary)

  expect(dictionary.allTokens).toMatchInlineSnapshot(`
    [
      Token {
        "extensions": {
          "category": "spacing",
          "condition": "base",
          "prop": "sm",
        },
        "name": "spacing.sm",
        "originalValue": "40px",
        "path": [
          "spacing",
          "sm",
        ],
        "type": "dimension",
        "value": "40px",
      },
      Token {
        "extensions": {
          "category": "spacing",
          "condition": "base",
          "isNegative": true,
          "prop": "sm",
        },
        "name": "spacing.-sm",
        "originalValue": "40px",
        "path": [
          "spacing",
          "-sm",
        ],
        "type": "dimension",
        "value": "40px",
      },
    ]
  `)
})

test('with semantic spacing', () => {
  const dictionary = new TokenDictionary({
    tokens: {
      spacing: {
        sm: { value: '40px' },
      },
    },
    semanticTokens: {
      spacing: {
        gutter: {
          value: { base: '{spacing.sm}', '@small': '0.5rem' },
        },
      },
    },
  })

  addNegativeTokens(dictionary)
  dictionary.build()

  expect(dictionary.allTokens).toMatchInlineSnapshot(`
    [
      Token {
        "extensions": {
          "category": "spacing",
          "condition": "base",
          "prop": "sm",
        },
        "name": "spacing.sm",
        "originalValue": "40px",
        "path": [
          "spacing",
          "sm",
        ],
        "type": "dimension",
        "value": "40px",
      },
      Token {
        "extensions": {
          "category": "spacing",
          "condition": "base",
          "conditions": {
            "@small": "0.5rem",
            "base": "{spacing.sm}",
          },
          "prop": "gutter",
        },
        "name": "spacing.gutter",
        "originalValue": "{spacing.sm}",
        "path": [
          "spacing",
          "gutter",
        ],
        "type": "dimension",
        "value": "40px",
      },
      Token {
        "extensions": {
          "category": "spacing",
          "condition": "@small",
          "conditions": {
            "@small": "0.5rem",
            "base": "{spacing.sm}",
          },
          "prop": "gutter",
        },
        "name": "spacing.gutter",
        "originalValue": "{spacing.sm}",
        "path": [
          "spacing",
          "gutter",
        ],
        "type": "dimension",
        "value": "0.5rem",
      },
      Token {
        "extensions": {
          "category": "spacing",
          "condition": "base",
          "isNegative": true,
          "prop": "sm",
        },
        "name": "spacing.-sm",
        "originalValue": "40px",
        "path": [
          "spacing",
          "-sm",
        ],
        "type": "dimension",
        "value": "40px",
      },
      Token {
        "extensions": {
          "category": "spacing",
          "condition": "base",
          "conditions": {
            "@small": "0.5rem",
            "base": "{spacing.sm}",
          },
          "isNegative": true,
          "prop": "gutter",
        },
        "name": "spacing.-gutter",
        "originalValue": "{spacing.sm}",
        "path": [
          "spacing",
          "-gutter",
        ],
        "type": "dimension",
        "value": "40px",
      },
      Token {
        "extensions": {
          "category": "spacing",
          "condition": "@small",
          "conditions": {
            "@small": "0.5rem",
            "base": "{spacing.sm}",
          },
          "isNegative": true,
          "prop": "gutter",
        },
        "name": "spacing.-gutter",
        "originalValue": "{spacing.sm}",
        "path": [
          "spacing",
          "-gutter",
        ],
        "type": "dimension",
        "value": "0.5rem",
      },
    ]
  `)
})

test('with semantic spacing', () => {
  const dictionary = new TokenDictionary({
    tokens: {
      spacing: {
        sm: { value: '40px' },
      },
    },
    semanticTokens: {
      spacing: {
        nested: { value: { base: '{spacing.sm}', sm: '50px' } },
      },
    },
  })

  addNegativeTokens(dictionary)
  dictionary.build()

  expect(dictionary.allTokens).toMatchInlineSnapshot(`
    [
      Token {
        "extensions": {
          "category": "spacing",
          "condition": "base",
          "prop": "sm",
        },
        "name": "spacing.sm",
        "originalValue": "40px",
        "path": [
          "spacing",
          "sm",
        ],
        "type": "dimension",
        "value": "40px",
      },
      Token {
        "extensions": {
          "category": "spacing",
          "condition": "base",
          "conditions": {
            "base": "{spacing.sm}",
            "sm": "50px",
          },
          "prop": "nested",
        },
        "name": "spacing.nested",
        "originalValue": "{spacing.sm}",
        "path": [
          "spacing",
          "nested",
        ],
        "type": "dimension",
        "value": "40px",
      },
      Token {
        "extensions": {
          "category": "spacing",
          "condition": "sm",
          "conditions": {
            "base": "{spacing.sm}",
            "sm": "50px",
          },
          "prop": "nested",
        },
        "name": "spacing.nested",
        "originalValue": "{spacing.sm}",
        "path": [
          "spacing",
          "nested",
        ],
        "type": "dimension",
        "value": "50px",
      },
      Token {
        "extensions": {
          "category": "spacing",
          "condition": "base",
          "isNegative": true,
          "prop": "sm",
        },
        "name": "spacing.-sm",
        "originalValue": "40px",
        "path": [
          "spacing",
          "-sm",
        ],
        "type": "dimension",
        "value": "40px",
      },
      Token {
        "extensions": {
          "category": "spacing",
          "condition": "base",
          "conditions": {
            "base": "{spacing.sm}",
            "sm": "50px",
          },
          "isNegative": true,
          "prop": "nested",
        },
        "name": "spacing.-nested",
        "originalValue": "{spacing.sm}",
        "path": [
          "spacing",
          "-nested",
        ],
        "type": "dimension",
        "value": "40px",
      },
      Token {
        "extensions": {
          "category": "spacing",
          "condition": "sm",
          "conditions": {
            "base": "{spacing.sm}",
            "sm": "50px",
          },
          "isNegative": true,
          "prop": "nested",
        },
        "name": "spacing.-nested",
        "originalValue": "{spacing.sm}",
        "path": [
          "spacing",
          "-nested",
        ],
        "type": "dimension",
        "value": "50px",
      },
    ]
  `)
})
