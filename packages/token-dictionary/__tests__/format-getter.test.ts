import { expect, test } from 'vitest'
import { TokenDictionary } from '../src/dictionary'
import { formats } from '../src/format'
import { transforms } from '../src/transform'

test('format / getter', () => {
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
          value: { base: '{colors.red}', dark: '#blue' },
        },
      },
    },
  })

  dictionary.registerTransform(...transforms)
  dictionary.build()

  const get = formats.createVarGetter(dictionary)

  expect(get('colors')).toMatchInlineSnapshot(`
    {
      "blue": "var(--colors-blue)",
      "brand": "var(--colors-brand)",
      "green": "var(--colors-green)",
      "pink.100": "var(--colors-pink-100)",
      "pink.50": "var(--colors-pink-50)",
      "red": "var(--colors-red)",
    }
  `)

  expect(get('colors.blue')).toMatchInlineSnapshot('"var(--colors-blue)"')
  expect(get('colors.brand')).toMatchInlineSnapshot('"var(--colors-brand)"')
})
