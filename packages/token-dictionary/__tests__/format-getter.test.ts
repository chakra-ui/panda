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
      "blue": "#0000ff",
      "brand": "var(--colors-brand)",
      "green": "#00ff00",
      "pink.100": "#0000ff",
      "pink.50": "#ff0000",
      "red": "#ff0000",
    }
  `)

  expect(get('colors.blue')).toMatchInlineSnapshot('"#0000ff"')
  expect(get('colors.brand')).toMatchInlineSnapshot('"var(--colors-brand)"')
})
