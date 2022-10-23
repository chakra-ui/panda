import { expect, test } from 'vitest'
import { TokenDictionary } from '../src/dictionary'
import { getFlattenedValues } from '../src/format'
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

  expect(getFlattenedValues(dictionary)).toMatchInlineSnapshot(`
    Map {
      "colors" => Map {
        "red" => "#ff0000",
        "blue" => "#0000ff",
        "green" => "#00ff00",
        "pink.50" => "#ff0000",
        "pink.100" => "#0000ff",
      },
    }
  `)
})
