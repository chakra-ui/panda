import { expect, test } from 'vitest'
import { TokenDictionary } from '../src/dictionary'

test('semantic tokens / duplicate token references with special characters', () => {
  const dictionary = new TokenDictionary({
    tokens: {
      sizes: {
        0.5: { value: '0.125rem' },
      },
    },
    semanticTokens: {
      shadows: {
        controlAccent: {
          value: '0 {sizes.0.5} {sizes.0.5} rgba(92, 225, 113, 0.25)',
        },
      },
    },
  })

  dictionary.registerTokens()
  dictionary.build()

  const shadowToken = dictionary.allTokens.find((t) => t.name === 'shadows.controlAccent')
  expect(shadowToken).toBeDefined()
  // Both occurrences of {sizes.0.5} should be resolved to the same value
  expect(shadowToken!.value).toMatchInlineSnapshot(`"0 0.125rem 0.125rem rgba(92, 225, 113, 0.25)"`)
})

test('semantic tokens / deeply nested', () => {
  const dictionary = new TokenDictionary({
    semanticTokens: {
      colors: {
        pink: { value: { base: '#fff', osDark: { highCon: 'sdfdfsd' } } },
      },
    },
  })

  dictionary.registerTokens()
  dictionary.build()

  expect(dictionary.allTokens).toMatchInlineSnapshot(`
    [
      Token {
        "deprecated": undefined,
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
          "rawValue": {
            "base": "#fff",
            "osDark": {
              "highCon": "sdfdfsd",
            },
          },
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
        "deprecated": undefined,
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
          "rawValue": {
            "base": "#fff",
            "osDark": {
              "highCon": "sdfdfsd",
            },
          },
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
