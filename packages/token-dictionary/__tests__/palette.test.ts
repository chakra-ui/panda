import { expect, test } from 'vitest'
import { addVirtualPalette } from '../src/middleware'
import { transforms } from '../src/transform'
import { formats } from '../src/format'
import { TokenDictionary } from '../src/dictionary'

test('should generate virtual palette', () => {
  const dictionary = new TokenDictionary({
    tokens: {
      colors: {
        primary: { value: '#000' },
        red: {
          300: { value: '#red300' },
          500: { value: '#red500' },
        },
        blue: {
          500: { value: '#blue500' },
          700: { value: '#blue700' },
        },
      },
    },
  })

  dictionary
    .registerTransform(...transforms)
    .registerMiddleware(addVirtualPalette)
    .build()

  expect(dictionary.allTokens).toMatchInlineSnapshot(`
    [
      Token {
        "extensions": {
          "category": "colors",
          "condition": "base",
          "palette": "",
          "prop": "primary",
          "var": "--colors-primary",
          "varRef": "var(--colors-primary)",
        },
        "name": "colors.primary",
        "originalValue": "#000",
        "path": [
          "colors",
          "primary",
        ],
        "type": "color",
        "value": "#000",
      },
      Token {
        "extensions": {
          "category": "colors",
          "condition": "base",
          "palette": "red",
          "prop": "red.300",
          "var": "--colors-red-300",
          "varRef": "var(--colors-red-300)",
        },
        "name": "colors.red.300",
        "originalValue": "#red300",
        "path": [
          "colors",
          "red",
          "300",
        ],
        "type": "color",
        "value": "#red300",
      },
      Token {
        "extensions": {
          "category": "colors",
          "condition": "base",
          "palette": "red",
          "prop": "red.500",
          "var": "--colors-red-500",
          "varRef": "var(--colors-red-500)",
        },
        "name": "colors.red.500",
        "originalValue": "#red500",
        "path": [
          "colors",
          "red",
          "500",
        ],
        "type": "color",
        "value": "#red500",
      },
      Token {
        "extensions": {
          "category": "colors",
          "condition": "base",
          "palette": "blue",
          "prop": "blue.500",
          "var": "--colors-blue-500",
          "varRef": "var(--colors-blue-500)",
        },
        "name": "colors.blue.500",
        "originalValue": "#blue500",
        "path": [
          "colors",
          "blue",
          "500",
        ],
        "type": "color",
        "value": "#blue500",
      },
      Token {
        "extensions": {
          "category": "colors",
          "condition": "base",
          "palette": "blue",
          "prop": "blue.700",
          "var": "--colors-blue-700",
          "varRef": "var(--colors-blue-700)",
        },
        "name": "colors.blue.700",
        "originalValue": "#blue700",
        "path": [
          "colors",
          "blue",
          "700",
        ],
        "type": "color",
        "value": "#blue700",
      },
      Token {
        "extensions": {
          "category": "colors",
          "condition": "base",
          "isVirtual": true,
          "palette": "palette",
          "prop": "palette.300",
          "var": "--colors-palette-300",
          "varRef": "var(--colors-palette-300)",
        },
        "name": "colors.palette.300",
        "originalValue": "{colors.palette.300}",
        "path": [
          "colors",
          "palette",
          "300",
        ],
        "type": "color",
        "value": "var(--colors-palette-300)",
      },
      Token {
        "extensions": {
          "category": "colors",
          "condition": "base",
          "isVirtual": true,
          "palette": "palette",
          "prop": "palette.500",
          "var": "--colors-palette-500",
          "varRef": "var(--colors-palette-500)",
        },
        "name": "colors.palette.500",
        "originalValue": "{colors.palette.500}",
        "path": [
          "colors",
          "palette",
          "500",
        ],
        "type": "color",
        "value": "var(--colors-palette-500)",
      },
      Token {
        "extensions": {
          "category": "colors",
          "condition": "base",
          "isVirtual": true,
          "palette": "palette",
          "prop": "palette.700",
          "var": "--colors-palette-700",
          "varRef": "var(--colors-palette-700)",
        },
        "name": "colors.palette.700",
        "originalValue": "{colors.palette.700}",
        "path": [
          "colors",
          "palette",
          "700",
        ],
        "type": "color",
        "value": "var(--colors-palette-700)",
      },
    ]
  `)

  expect(formats.groupByPalette(dictionary)).toMatchInlineSnapshot(`
    Map {
      "red" => Map {
        "--colors-palette-300" => "var(--colors-red-300)",
        "--colors-palette-500" => "var(--colors-red-500)",
      },
      "blue" => Map {
        "--colors-palette-500" => "var(--colors-blue-500)",
        "--colors-palette-700" => "var(--colors-blue-700)",
      },
    }
  `)

  expect(formats.getFlattenedValues(dictionary)).toMatchInlineSnapshot(`
    Map {
      "colors" => Map {
        "primary" => "var(--colors-primary)",
        "red.300" => "var(--colors-red-300)",
        "red.500" => "var(--colors-red-500)",
        "blue.500" => "var(--colors-blue-500)",
        "blue.700" => "var(--colors-blue-700)",
        "palette.300" => "var(--colors-palette-300)",
        "palette.500" => "var(--colors-palette-500)",
        "palette.700" => "var(--colors-palette-700)",
      },
    }
  `)

  const getVar = formats.createVarGetter(dictionary)
  expect(getVar('colors.palette.300')).toMatchInlineSnapshot('"var(--colors-palette-300)"')

  expect(formats.getPaletteValues(dictionary)).toMatchInlineSnapshot(`
    Set {
      "red",
      "blue",
    }
  `)
})
