import { expect, test } from 'vitest'
import { TokenDictionary } from '../src/dictionary'

test('format / token name', () => {
  const dictionary = new TokenDictionary({
    formatTokenName: (path) => {
      return `$${path.join('-')}`
    },
    tokens: {
      colors: {
        red: { value: '#ff0000' },
        blue: { value: '#0000ff' },
        green: { value: '#00ff00' },
        pink: {
          50: { value: '#ff0000' },
          100: { value: '#0000ff' },
        },
      },
    },
    semanticTokens: {
      colors: {
        brand: {
          value: { base: '{colors.red}', dark: '{colors.blue}' },
        },
      },
    },
  })

  dictionary.build()

  expect(dictionary.allNames).toEqual([
    '$colors-red',
    '$colors-blue',
    '$colors-green',
    '$colors-pink-50',
    '$colors-pink-100',
    '$colors-brand',
  ])
})
