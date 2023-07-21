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
        "description": undefined,
        "extensions": {
          "category": "colors",
          "colorPalette": "",
          "condition": "base",
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
        "description": undefined,
        "extensions": {
          "category": "colors",
          "colorPalette": "red",
          "condition": "base",
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
        "description": undefined,
        "extensions": {
          "category": "colors",
          "colorPalette": "red",
          "condition": "base",
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
        "description": undefined,
        "extensions": {
          "category": "colors",
          "colorPalette": "blue",
          "condition": "base",
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
        "description": undefined,
        "extensions": {
          "category": "colors",
          "colorPalette": "blue",
          "condition": "base",
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
        "description": undefined,
        "extensions": {
          "category": "colors",
          "colorPalette": "",
          "condition": "base",
          "isVirtual": true,
          "prop": "colorPalette.300",
          "var": "--colors-color-palette-300",
          "varRef": "var(--colors-color-palette-300)",
        },
        "name": "colors.colorPalette.300",
        "originalValue": "{colors.colorPalette.300}",
        "path": [
          "colors",
          "colorPalette",
          "300",
        ],
        "type": "color",
        "value": "var(--colors-color-palette-300)",
      },
      Token {
        "description": undefined,
        "extensions": {
          "category": "colors",
          "colorPalette": "",
          "condition": "base",
          "isVirtual": true,
          "prop": "colorPalette.500",
          "var": "--colors-color-palette-500",
          "varRef": "var(--colors-color-palette-500)",
        },
        "name": "colors.colorPalette.500",
        "originalValue": "{colors.colorPalette.500}",
        "path": [
          "colors",
          "colorPalette",
          "500",
        ],
        "type": "color",
        "value": "var(--colors-color-palette-500)",
      },
      Token {
        "description": undefined,
        "extensions": {
          "category": "colors",
          "colorPalette": "",
          "condition": "base",
          "isVirtual": true,
          "prop": "colorPalette.700",
          "var": "--colors-color-palette-700",
          "varRef": "var(--colors-color-palette-700)",
        },
        "name": "colors.colorPalette.700",
        "originalValue": "{colors.colorPalette.700}",
        "path": [
          "colors",
          "colorPalette",
          "700",
        ],
        "type": "color",
        "value": "var(--colors-color-palette-700)",
      },
    ]
  `)

  expect(formats.groupByColorPalette(dictionary)).toMatchInlineSnapshot(`
    Map {
      "red" => Map {
        "--colors-color-palette-300" => "var(--colors-red-300)",
        "--colors-color-palette-500" => "var(--colors-red-500)",
      },
      "blue" => Map {
        "--colors-color-palette-500" => "var(--colors-blue-500)",
        "--colors-color-palette-700" => "var(--colors-blue-700)",
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
        "colorPalette.300" => "var(--colors-color-palette-300)",
        "colorPalette.500" => "var(--colors-color-palette-500)",
        "colorPalette.700" => "var(--colors-color-palette-700)",
      },
    }
  `)

  const getVar = formats.createVarGetter(dictionary)
  expect(getVar('colors.colorPalette.300')).toMatchInlineSnapshot('"var(--colors-color-palette-300)"')

  expect(formats.getColorPaletteValues(dictionary)).toMatchInlineSnapshot(`
    Set {
      "red",
      "blue",
    }
  `)
})
