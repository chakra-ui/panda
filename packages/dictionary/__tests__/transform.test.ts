import { expect, test } from 'vitest'
import { TokenDictionary } from '../src/dictionary'
import { transformGradient, transformShadow } from '../src/transform'

test('transform / shadow', () => {
  const dictionary = new TokenDictionary({
    tokens: {
      colors: {
        red: { value: '#ff0000' },
      },
      shadows: {
        sm: { value: { offsetX: 4, offsetY: 10, blur: 4, spread: 0, color: '{colors.red}' } },
        md: { value: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },
      },
    },
  })

  dictionary.registerTransform(transformShadow)

  dictionary.build()

  expect(dictionary.allTokens).toMatchInlineSnapshot(`
    [
      Token {
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
        "extensions": {
          "category": "shadows",
          "condition": "base",
          "prop": "sm",
        },
        "name": "shadows.sm",
        "originalValue": {
          "blur": 4,
          "color": "{colors.red}",
          "offsetX": 4,
          "offsetY": 10,
          "spread": 0,
        },
        "path": [
          "shadows",
          "sm",
        ],
        "type": "shadow",
        "value": "4px 10px 4px 0px #ff0000",
      },
      Token {
        "extensions": {
          "category": "shadows",
          "condition": "base",
          "prop": "md",
        },
        "name": "shadows.md",
        "originalValue": "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        "path": [
          "shadows",
          "md",
        ],
        "type": "shadow",
        "value": "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      },
    ]
  `)
})

test('transform / gradient', () => {
  const dictionary = new TokenDictionary({
    tokens: {
      colors: {
        pink: { value: '#ff00ff' },
      },
      gradients: {
        primary: {
          value: {
            type: 'linear',
            placement: 'to top',
            stops: [
              { color: '#ff0000', position: 0 },
              { color: '{colors.pink}', position: 100 },
            ],
          },
        },
      },
    },
  })

  dictionary.registerTransform(transformGradient)

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
          "category": "gradients",
          "condition": "base",
          "prop": "primary",
        },
        "name": "gradients.primary",
        "originalValue": {
          "placement": "to top",
          "stops": [
            {
              "color": "#ff0000",
              "position": 0,
            },
            {
              "color": "{colors.pink}",
              "position": 100,
            },
          ],
          "type": "linear",
        },
        "path": [
          "gradients",
          "primary",
        ],
        "type": "gradient",
        "value": "linear-gradient(to top, #ff0000 0px, #ff00ff 100px)",
      },
    ]
  `)
})
