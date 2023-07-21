import { expect, test } from 'vitest'
import { TokenDictionary } from '../src/dictionary'
import { formats } from '../src/format'
import { transforms } from '../src/transform'

test('format / by category', () => {
  const dictionary = new TokenDictionary({
    tokens: {
      colors: {
        red: { value: '#ff0000' },
        blue: { value: '#0000ff' },
        green: { value: '#00ff00' },
      },
    },
  })

  dictionary.registerTransform(...transforms)
  dictionary.build()

  expect(formats.groupByCategory(dictionary)).toMatchInlineSnapshot(`
    Map {
      "colors" => Map {
        "red" => Token {
          "description": undefined,
          "extensions": {
            "category": "colors",
            "colorPalette": "",
            "condition": "base",
            "prop": "red",
            "var": "--colors-red",
            "varRef": "var(--colors-red)",
          },
          "name": "colors.red",
          "originalValue": "#ff0000",
          "path": [
            "colors",
            "red",
          ],
          "type": "color",
          "value": "#ff0000",
        },
        "blue" => Token {
          "description": undefined,
          "extensions": {
            "category": "colors",
            "colorPalette": "",
            "condition": "base",
            "prop": "blue",
            "var": "--colors-blue",
            "varRef": "var(--colors-blue)",
          },
          "name": "colors.blue",
          "originalValue": "#0000ff",
          "path": [
            "colors",
            "blue",
          ],
          "type": "color",
          "value": "#0000ff",
        },
        "green" => Token {
          "description": undefined,
          "extensions": {
            "category": "colors",
            "colorPalette": "",
            "condition": "base",
            "prop": "green",
            "var": "--colors-green",
            "varRef": "var(--colors-green)",
          },
          "name": "colors.green",
          "originalValue": "#00ff00",
          "path": [
            "colors",
            "green",
          ],
          "type": "color",
          "value": "#00ff00",
        },
      },
    }
  `)
})
