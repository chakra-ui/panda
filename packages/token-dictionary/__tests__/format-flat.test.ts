import { expect, test } from 'vitest'
import { TokenDictionary } from '../src/dictionary'
import { formats } from '../src/format'
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

  dictionary.registerTransform(...transforms)
  dictionary.build()

  expect(formats.getFlattenedValues(dictionary)).toMatchInlineSnapshot(`
    Map {
      "colors" => Map {
        "red" => "var(--colors-red)",
        "blue" => "var(--colors-blue)",
        "green" => "var(--colors-green)",
        "pink.50" => "var(--colors-pink-50)",
        "pink.100" => "var(--colors-pink-100)",
      },
    }
  `)
})
