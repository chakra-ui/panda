import { expect, test } from 'vitest'
import { TokenDictionary } from '../src/dictionary'
import { transforms } from '../src/transform'

test('format / json flat', () => {
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
  })

  dictionary.setTokens()
  dictionary.registerTransform(...transforms)
  dictionary.build()

  expect(dictionary.view.values).toMatchInlineSnapshot(`
    Map {
      "colors.red" => "var(--colors-red)",
      "colors.blue" => "var(--colors-blue)",
      "colors.green" => "var(--colors-green)",
      "colors.pink.50" => "var(--colors-pink-50)",
      "colors.pink.100" => "var(--colors-pink-100)",
    }
  `)
})
