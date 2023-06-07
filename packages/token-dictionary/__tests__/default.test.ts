import { expect, test } from 'vitest'
import { TokenDictionary } from '../src/dictionary'

test('tokens / with default', () => {
  const dictionary = new TokenDictionary({
    tokens: {
      colors: {
        red: {
          DEFAULT: { value: '#red' },
          hot: { value: '#redhot' },
        },
      },
    },
    semanticTokens: {
      colors: {
        error: { value: '{colors.red}' },
      },
    },
  })

  dictionary.build()

  expect(dictionary.allTokens.map(({ name, value }) => ({ name, value }))).toMatchInlineSnapshot(`
    [
      {
        "name": "colors.red",
        "value": "#red",
      },
      {
        "name": "colors.red.hot",
        "value": "#redhot",
      },
      {
        "name": "colors.error",
        "value": "#red",
      },
    ]
  `)
})
