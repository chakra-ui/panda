import { expect, test } from 'vitest'
import { TokenDictionary } from '../src/dictionary'

test('format / token name', () => {
  const dictionary = new TokenDictionary({
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
  dictionary.formatTokenName = (path) => {
    return `$${path.join('-')}`
  }

  dictionary.setTokens()
  dictionary.build()

  expect(Array.from(dictionary.byName.keys())).toEqual([
    '$colors-red',
    '$colors-blue',
    '$colors-green',
    '$colors-pink-50',
    '$colors-pink-100',
    '$colors-brand',
  ])
})
