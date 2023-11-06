import { expect, test } from 'vitest'
import { TokenDictionary } from '../src/dictionary'
import { transformGradient } from '../src/transform'

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
        "description": undefined,
        "extensions": {
          "category": "colors",
          "condition": "base",
          "prop": "pink",
          "rawPath": [
            "colors",
            "pink",
          ],
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
          "category": "gradients",
          "condition": "base",
          "prop": "primary",
          "rawPath": [
            "gradients",
            "primary",
          ],
        },
        "name": "gradients.primary",
        "originalValue": "linear-gradient(to top, #ff0000 0px, {colors.pink} 100px)",
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
