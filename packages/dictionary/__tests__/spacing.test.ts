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

  dictionary.expandReferences()

  // addNegativeTokens(dictionary)

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
        "value": "{spacing.sm}",
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

  
  dictionary.addConditionalTokens()
  dictionary.expandReferences()

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
          "prop": "nested",
        },
        "name": "spacing.nested",
        "originalValue": "{spacing.sm}",
        "path": [
          "spacing",
          "nested",
        ],
        "type": "dimension",
        "value": "{spacing.sm}",
      },
      Token {
        "extensions": {
          "category": "spacing",
          "condition": "sm",
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
        "value": "{spacing.sm}",
      },
      Token {
        "extensions": {
          "category": "spacing",
          "condition": "sm",
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
