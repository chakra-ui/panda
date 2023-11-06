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
          "condition": "base",
          "prop": "primary",
          "rawPath": [
            "colors",
            "primary",
          ],
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
          "colorPaletteRoots": [
            "red",
          ],
          "colorPaletteTokenKeys": [
            "300",
          ],
          "condition": "base",
          "prop": "red.300",
          "rawPath": [
            "colors",
            "red",
            "300",
          ],
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
          "colorPaletteRoots": [
            "red",
          ],
          "colorPaletteTokenKeys": [
            "500",
          ],
          "condition": "base",
          "prop": "red.500",
          "rawPath": [
            "colors",
            "red",
            "500",
          ],
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
          "colorPaletteRoots": [
            "blue",
          ],
          "colorPaletteTokenKeys": [
            "500",
          ],
          "condition": "base",
          "prop": "blue.500",
          "rawPath": [
            "colors",
            "blue",
            "500",
          ],
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
          "colorPaletteRoots": [
            "blue",
          ],
          "colorPaletteTokenKeys": [
            "700",
          ],
          "condition": "base",
          "prop": "blue.700",
          "rawPath": [
            "colors",
            "blue",
            "700",
          ],
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
          "condition": "base",
          "isVirtual": true,
          "prop": "colorPalette.300",
          "var": "--colors-color-palette-300",
          "varRef": "var(--colors-color-palette-300)",
        },
        "name": "colors.colorPalette.300",
        "originalValue": "colors.colorPalette.300",
        "path": [
          "colors",
          "colorPalette",
          "300",
        ],
        "type": "color",
        "value": "colors.colorPalette.300",
      },
      Token {
        "description": undefined,
        "extensions": {
          "category": "colors",
          "condition": "base",
          "isVirtual": true,
          "prop": "colorPalette.500",
          "var": "--colors-color-palette-500",
          "varRef": "var(--colors-color-palette-500)",
        },
        "name": "colors.colorPalette.500",
        "originalValue": "colors.colorPalette.500",
        "path": [
          "colors",
          "colorPalette",
          "500",
        ],
        "type": "color",
        "value": "colors.colorPalette.500",
      },
      Token {
        "description": undefined,
        "extensions": {
          "category": "colors",
          "condition": "base",
          "isVirtual": true,
          "prop": "colorPalette.700",
          "var": "--colors-color-palette-700",
          "varRef": "var(--colors-color-palette-700)",
        },
        "name": "colors.colorPalette.700",
        "originalValue": "colors.colorPalette.700",
        "path": [
          "colors",
          "colorPalette",
          "700",
        ],
        "type": "color",
        "value": "colors.colorPalette.700",
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

test('should generate nested object virtual palette', () => {
  const dictionary = new TokenDictionary({
    semanticTokens: {
      colors: {
        button: {
          dark: {
            value: 'navy',
          },
          light: {
            DEFAULT: {
              value: 'skyblue',
            },
            accent: {
              DEFAULT: {
                value: 'cyan',
              },
              secondary: {
                value: 'blue',
              },
            },
          },
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
          "colorPalette": "button",
          "colorPaletteRoots": [
            "button",
          ],
          "colorPaletteTokenKeys": [
            "dark",
          ],
          "condition": "base",
          "conditions": {
            "base": "navy",
          },
          "prop": "button.dark",
          "rawPath": [
            "colors",
            "button",
            "dark",
          ],
          "var": "--colors-button-dark",
          "varRef": "var(--colors-button-dark)",
        },
        "name": "colors.button.dark",
        "originalValue": "navy",
        "path": [
          "colors",
          "button",
          "dark",
        ],
        "type": "color",
        "value": "navy",
      },
      Token {
        "description": undefined,
        "extensions": {
          "category": "colors",
          "colorPalette": "button",
          "colorPaletteRoots": [
            "button",
          ],
          "colorPaletteTokenKeys": [
            "light",
          ],
          "condition": "base",
          "conditions": {
            "base": "skyblue",
          },
          "prop": "button.light",
          "rawPath": [
            "colors",
            "button",
            "light",
            "DEFAULT",
          ],
          "var": "--colors-button-light",
          "varRef": "var(--colors-button-light)",
        },
        "name": "colors.button.light",
        "originalValue": "skyblue",
        "path": [
          "colors",
          "button",
          "light",
        ],
        "type": "color",
        "value": "skyblue",
      },
      Token {
        "description": undefined,
        "extensions": {
          "category": "colors",
          "colorPalette": "button.light",
          "colorPaletteRoots": [
            "button",
            "button.light",
          ],
          "colorPaletteTokenKeys": [
            "light.accent",
            "accent",
          ],
          "condition": "base",
          "conditions": {
            "base": "cyan",
          },
          "prop": "button.light.accent",
          "rawPath": [
            "colors",
            "button",
            "light",
            "accent",
            "DEFAULT",
          ],
          "var": "--colors-button-light-accent",
          "varRef": "var(--colors-button-light-accent)",
        },
        "name": "colors.button.light.accent",
        "originalValue": "cyan",
        "path": [
          "colors",
          "button",
          "light",
          "accent",
        ],
        "type": "color",
        "value": "cyan",
      },
      Token {
        "description": undefined,
        "extensions": {
          "category": "colors",
          "colorPalette": "button.light.accent",
          "colorPaletteRoots": [
            "button",
            "button.light",
            "button.light.accent",
          ],
          "colorPaletteTokenKeys": [
            "light.accent.secondary",
            "accent.secondary",
            "secondary",
          ],
          "condition": "base",
          "conditions": {
            "base": "blue",
          },
          "prop": "button.light.accent.secondary",
          "rawPath": [
            "colors",
            "button",
            "light",
            "accent",
            "secondary",
          ],
          "var": "--colors-button-light-accent-secondary",
          "varRef": "var(--colors-button-light-accent-secondary)",
        },
        "name": "colors.button.light.accent.secondary",
        "originalValue": "blue",
        "path": [
          "colors",
          "button",
          "light",
          "accent",
          "secondary",
        ],
        "type": "color",
        "value": "blue",
      },
      Token {
        "description": undefined,
        "extensions": {
          "category": "colors",
          "condition": "base",
          "isVirtual": true,
          "prop": "colorPalette.dark",
          "var": "--colors-color-palette-dark",
          "varRef": "var(--colors-color-palette-dark)",
        },
        "name": "colors.colorPalette.dark",
        "originalValue": "colors.colorPalette.dark",
        "path": [
          "colors",
          "colorPalette",
          "dark",
        ],
        "type": "color",
        "value": "colors.colorPalette.dark",
      },
      Token {
        "description": undefined,
        "extensions": {
          "category": "colors",
          "condition": "base",
          "isVirtual": true,
          "prop": "colorPalette.light",
          "var": "--colors-color-palette-light",
          "varRef": "var(--colors-color-palette-light)",
        },
        "name": "colors.colorPalette.light",
        "originalValue": "colors.colorPalette.light",
        "path": [
          "colors",
          "colorPalette",
          "light",
        ],
        "type": "color",
        "value": "colors.colorPalette.light",
      },
      Token {
        "description": undefined,
        "extensions": {
          "category": "colors",
          "condition": "base",
          "isVirtual": true,
          "prop": "colorPalette.light.accent",
          "var": "--colors-color-palette-light-accent",
          "varRef": "var(--colors-color-palette-light-accent)",
        },
        "name": "colors.colorPalette.light.accent",
        "originalValue": "colors.colorPalette.light.accent",
        "path": [
          "colors",
          "colorPalette",
          "light",
          "accent",
        ],
        "type": "color",
        "value": "colors.colorPalette.light.accent",
      },
      Token {
        "description": undefined,
        "extensions": {
          "category": "colors",
          "condition": "base",
          "isVirtual": true,
          "prop": "colorPalette.accent",
          "var": "--colors-color-palette-accent",
          "varRef": "var(--colors-color-palette-accent)",
        },
        "name": "colors.colorPalette.accent",
        "originalValue": "colors.colorPalette.accent",
        "path": [
          "colors",
          "colorPalette",
          "accent",
        ],
        "type": "color",
        "value": "colors.colorPalette.accent",
      },
      Token {
        "description": undefined,
        "extensions": {
          "category": "colors",
          "condition": "base",
          "isVirtual": true,
          "prop": "colorPalette.light.accent.secondary",
          "var": "--colors-color-palette-light-accent-secondary",
          "varRef": "var(--colors-color-palette-light-accent-secondary)",
        },
        "name": "colors.colorPalette.light.accent.secondary",
        "originalValue": "colors.colorPalette.light.accent.secondary",
        "path": [
          "colors",
          "colorPalette",
          "light",
          "accent",
          "secondary",
        ],
        "type": "color",
        "value": "colors.colorPalette.light.accent.secondary",
      },
      Token {
        "description": undefined,
        "extensions": {
          "category": "colors",
          "condition": "base",
          "isVirtual": true,
          "prop": "colorPalette.accent.secondary",
          "var": "--colors-color-palette-accent-secondary",
          "varRef": "var(--colors-color-palette-accent-secondary)",
        },
        "name": "colors.colorPalette.accent.secondary",
        "originalValue": "colors.colorPalette.accent.secondary",
        "path": [
          "colors",
          "colorPalette",
          "accent",
          "secondary",
        ],
        "type": "color",
        "value": "colors.colorPalette.accent.secondary",
      },
      Token {
        "description": undefined,
        "extensions": {
          "category": "colors",
          "condition": "base",
          "isVirtual": true,
          "prop": "colorPalette.secondary",
          "var": "--colors-color-palette-secondary",
          "varRef": "var(--colors-color-palette-secondary)",
        },
        "name": "colors.colorPalette.secondary",
        "originalValue": "colors.colorPalette.secondary",
        "path": [
          "colors",
          "colorPalette",
          "secondary",
        ],
        "type": "color",
        "value": "colors.colorPalette.secondary",
      },
    ]
  `)

  expect(formats.groupByColorPalette(dictionary)).toMatchInlineSnapshot(`
    Map {
      "button" => Map {
        "--colors-color-palette-dark" => "var(--colors-button-dark)",
        "--colors-color-palette-light" => "var(--colors-button-light)",
        "--colors-color-palette-light-accent" => "var(--colors-button-light-accent)",
        "--colors-color-palette-light-accent-secondary" => "var(--colors-button-light-accent-secondary)",
      },
      "button.light" => Map {
        "--colors-color-palette-accent" => "var(--colors-button-light-accent)",
        "--colors-color-palette-accent-secondary" => "var(--colors-button-light-accent-secondary)",
      },
      "button.light.accent" => Map {
        "--colors-color-palette-secondary" => "var(--colors-button-light-accent-secondary)",
      },
    }
  `)

  expect(formats.getFlattenedValues(dictionary)).toMatchInlineSnapshot(`
    Map {
      "colors" => Map {
        "button.dark" => "var(--colors-button-dark)",
        "button.light" => "var(--colors-button-light)",
        "button.light.accent" => "var(--colors-button-light-accent)",
        "button.light.accent.secondary" => "var(--colors-button-light-accent-secondary)",
        "colorPalette.dark" => "var(--colors-color-palette-dark)",
        "colorPalette.light" => "var(--colors-color-palette-light)",
        "colorPalette.light.accent" => "var(--colors-color-palette-light-accent)",
        "colorPalette.accent" => "var(--colors-color-palette-accent)",
        "colorPalette.light.accent.secondary" => "var(--colors-color-palette-light-accent-secondary)",
        "colorPalette.accent.secondary" => "var(--colors-color-palette-accent-secondary)",
        "colorPalette.secondary" => "var(--colors-color-palette-secondary)",
      },
    }
  `)

  const getVar = formats.createVarGetter(dictionary)
  expect(getVar('colors.colorPalette.light.accent.secondary')).toMatchInlineSnapshot(
    '"var(--colors-color-palette-light-accent-secondary)"',
  )

  expect(formats.getColorPaletteValues(dictionary)).toMatchInlineSnapshot(`
    Set {
      "button",
      "button.light",
      "button.light.accent",
    }
  `)
})

test('should work with DEFAULT keyword', () => {
  const dictionary = new TokenDictionary({
    tokens: {
      colors: {
        brand: {
          DEFAULT: { value: 'green' },
          hot: {
            DEFAULT: { value: 'blue' },
            er: { value: '#FF0000' },
          },
        },
      },
    },
  })

  dictionary
    .registerTransform(...transforms)
    .registerMiddleware(addVirtualPalette)
    .build()

  expect(formats.groupByColorPalette(dictionary)).toMatchInlineSnapshot(`
    Map {
      "brand" => Map {
        "--colors-color-palette" => "var(--colors-brand)",
        "--colors-color-palette-hot" => "var(--colors-brand-hot)",
        "--colors-color-palette-hot-er" => "var(--colors-brand-hot-er)",
      },
      "brand.hot" => Map {
        "--colors-color-palette-er" => "var(--colors-brand-hot-er)",
      },
    }
  `)
})
