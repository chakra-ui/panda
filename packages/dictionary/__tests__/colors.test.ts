import { expect, test } from 'vitest'
import { TokenDictionary } from '../src/dictionary'

test('tokens / basic', () => {
  const dictionary = new TokenDictionary({
    tokens: {
      colors: {
        pink: { value: '#ff00ff' },
        red: { 300: { value: '#ff0000' } },
      },
    },
  })

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
          "prop": "red.300",
        },
        "name": "colors.red.300",
        "originalValue": "#ff0000",
        "path": [
          "colors",
          "red",
          "300",
        ],
        "type": "color",
        "value": "#ff0000",
      },
    ]
  `)
})

test('semantic tokens / nested', () => {
  const dictionary = new TokenDictionary({
    semanticTokens: {
      colors: {
        grabbed: { value: { base: '#fff' } },
        disabled: { value: { '@light': '#333', '@dark': '#222' } },
        button: {
          primary: { value: { base: 'red' } },
        },
      },
    },
  })

  expect(dictionary.allTokens).toMatchInlineSnapshot(`
    [
      Token {
        "extensions": {
          "category": "colors",
          "condition": "base",
          "conditions": {
            "base": "#fff",
          },
          "prop": "grabbed",
        },
        "name": "colors.grabbed",
        "originalValue": "#fff",
        "path": [
          "colors",
          "grabbed",
        ],
        "type": "color",
        "value": "#fff",
      },
      Token {
        "extensions": {
          "category": "colors",
          "condition": "base",
          "conditions": {
            "@dark": "#222",
            "@light": "#333",
          },
          "prop": "disabled",
        },
        "name": "colors.disabled",
        "originalValue": "",
        "path": [
          "colors",
          "disabled",
        ],
        "type": "color",
        "value": "",
      },
      Token {
        "extensions": {
          "category": "colors",
          "condition": "base",
          "conditions": {
            "base": "red",
          },
          "prop": "button.primary",
        },
        "name": "colors.button.primary",
        "originalValue": "red",
        "path": [
          "colors",
          "button",
          "primary",
        ],
        "type": "color",
        "value": "red",
      },
    ]
  `)
})
