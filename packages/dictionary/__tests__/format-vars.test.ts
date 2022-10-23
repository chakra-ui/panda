import { expect, test } from 'vitest'
import { TokenDictionary } from '../src/dictionary'
import { getVars } from '../src/format'
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
    semanticTokens: {
      colors: {
        brand: {
          value: { base: '{colors.red}', dark: '{colors.blue}' },
        },
      },
    },
  })

  dictionary.registerTransform(...transforms)
  dictionary.build()

  expect(getVars(dictionary)).toMatchInlineSnapshot(`
    Map {
      "base" => Map {
        "--colors-red" => "#ff0000",
        "--colors-blue" => "#0000ff",
        "--colors-green" => "#00ff00",
        "--colors-pink-50" => "#ff0000",
        "--colors-pink-100" => "#0000ff",
        "--colors-brand" => "#ff0000",
      },
      "dark" => Map {
        "--colors-brand" => "#0000ff",
      },
    }
  `)
})
