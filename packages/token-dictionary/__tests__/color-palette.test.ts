import { expect, test } from 'vitest'
import { addVirtualPalette } from '../src/middleware'
import { transforms } from '../src/transform'
import { TokenDictionary } from '../src/dictionary'

const dasherize = (token: string) =>
  token
    .toString()
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

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
    .registerTokens()
    .registerTransform(...transforms)
    .registerMiddleware(addVirtualPalette)
    .build()

  expect(dictionary.allTokens).toMatchInlineSnapshot(`
    [
      Token {
        "description": undefined,
        "extensions": {
          "category": "colors",
          "colorPalette": "primary",
          "colorPaletteRoots": [
            [
              "primary",
            ],
          ],
          "colorPaletteTokenKeys": [
            [
              "",
            ],
          ],
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
          "colorPaletteRoots": [
            [
              "red",
            ],
          ],
          "colorPaletteTokenKeys": [
            [
              "300",
            ],
          ],
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
          "colorPaletteRoots": [
            [
              "red",
            ],
          ],
          "colorPaletteTokenKeys": [
            [
              "500",
            ],
          ],
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
          "colorPaletteRoots": [
            [
              "blue",
            ],
          ],
          "colorPaletteTokenKeys": [
            [
              "500",
            ],
          ],
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
          "colorPaletteRoots": [
            [
              "blue",
            ],
          ],
          "colorPaletteTokenKeys": [
            [
              "700",
            ],
          ],
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
          "condition": "base",
          "isVirtual": true,
          "prop": "colorPalette",
          "var": "--colors-color-palette",
          "varRef": "var(--colors-color-palette)",
        },
        "name": "colors.colorPalette",
        "originalValue": "colors.colorPalette",
        "path": [
          "colors",
          "colorPalette",
          "",
        ],
        "type": "color",
        "value": "colors.colorPalette",
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

  expect(dictionary.view.colorPalettes).toMatchInlineSnapshot(`
    Map {
      "primary" => Map {
        "--colors-color-palette" => "var(--colors-primary)",
      },
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

  expect(dictionary.view.values).toMatchInlineSnapshot(`
    Map {
      "colors.primary" => "var(--colors-primary)",
      "colors.red.300" => "var(--colors-red-300)",
      "colors.red.500" => "var(--colors-red-500)",
      "colors.blue.500" => "var(--colors-blue-500)",
      "colors.blue.700" => "var(--colors-blue-700)",
      "colors.colorPalette" => "var(--colors-color-palette)",
      "colors.colorPalette.300" => "var(--colors-color-palette-300)",
      "colors.colorPalette.500" => "var(--colors-color-palette-500)",
      "colors.colorPalette.700" => "var(--colors-color-palette-700)",
    }
  `)

  const getVar = dictionary.view.get
  expect(getVar('colors.colorPalette.300')).toMatchInlineSnapshot(`"var(--colors-color-palette-300)"`)

  expect(Array.from(dictionary.view.colorPalettes.keys())).toMatchInlineSnapshot(`
    [
      "primary",
      "red",
      "blue",
    ]
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
    .registerTokens()
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
            [
              "button",
            ],
          ],
          "colorPaletteTokenKeys": [
            [
              "dark",
            ],
          ],
          "condition": "base",
          "conditions": {
            "base": "navy",
          },
          "prop": "button.dark",
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
            [
              "button",
            ],
          ],
          "colorPaletteTokenKeys": [
            [
              "light",
            ],
          ],
          "condition": "base",
          "conditions": {
            "base": "skyblue",
          },
          "isDefault": true,
          "prop": "button.light",
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
            [
              "button",
            ],
            [
              "button",
              "light",
            ],
          ],
          "colorPaletteTokenKeys": [
            [
              "light",
              "accent",
            ],
            [
              "accent",
            ],
          ],
          "condition": "base",
          "conditions": {
            "base": "cyan",
          },
          "isDefault": true,
          "prop": "button.light.accent",
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
            [
              "button",
            ],
            [
              "button",
              "light",
            ],
            [
              "button",
              "light",
              "accent",
            ],
          ],
          "colorPaletteTokenKeys": [
            [
              "light",
              "accent",
              "secondary",
            ],
            [
              "accent",
              "secondary",
            ],
            [
              "secondary",
            ],
          ],
          "condition": "base",
          "conditions": {
            "base": "blue",
          },
          "prop": "button.light.accent.secondary",
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
          "prop": "colorPalette",
          "var": "--colors-color-palette",
          "varRef": "var(--colors-color-palette)",
        },
        "name": "colors.colorPalette",
        "originalValue": "colors.colorPalette",
        "path": [
          "colors",
          "colorPalette",
        ],
        "type": "color",
        "value": "colors.colorPalette",
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
          "prop": "colorPalette",
          "var": "--colors-color-palette",
          "varRef": "var(--colors-color-palette)",
        },
        "name": "colors.colorPalette",
        "originalValue": "colors.colorPalette",
        "path": [
          "colors",
          "colorPalette",
        ],
        "type": "color",
        "value": "colors.colorPalette",
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

  expect(dictionary.view.colorPalettes).toMatchInlineSnapshot(`
    Map {
      "button" => Map {
        "--colors-color-palette-dark" => "var(--colors-button-dark)",
        "--colors-color-palette-light" => "var(--colors-button-light)",
        "--colors-color-palette-light-accent" => "var(--colors-button-light-accent)",
        "--colors-color-palette-light-accent-secondary" => "var(--colors-button-light-accent-secondary)",
      },
      "button.light" => Map {
        "--colors-color-palette" => "var(--colors-button-light)",
        "--colors-color-palette-accent" => "var(--colors-button-light-accent)",
        "--colors-color-palette-accent-secondary" => "var(--colors-button-light-accent-secondary)",
      },
      "button.light.accent" => Map {
        "--colors-color-palette" => "var(--colors-button-light-accent)",
        "--colors-color-palette-secondary" => "var(--colors-button-light-accent-secondary)",
      },
    }
  `)

  expect(dictionary.view.values).toMatchInlineSnapshot(`
    Map {
      "colors.button.dark" => "var(--colors-button-dark)",
      "colors.button.light" => "var(--colors-button-light)",
      "colors.button.light.accent" => "var(--colors-button-light-accent)",
      "colors.button.light.accent.secondary" => "var(--colors-button-light-accent-secondary)",
      "colors.colorPalette.dark" => "var(--colors-color-palette-dark)",
      "colors.colorPalette.light" => "var(--colors-color-palette-light)",
      "colors.colorPalette" => "var(--colors-color-palette)",
      "colors.colorPalette.light.accent" => "var(--colors-color-palette-light-accent)",
      "colors.colorPalette.accent" => "var(--colors-color-palette-accent)",
      "colors.colorPalette.light.accent.secondary" => "var(--colors-color-palette-light-accent-secondary)",
      "colors.colorPalette.accent.secondary" => "var(--colors-color-palette-accent-secondary)",
      "colors.colorPalette.secondary" => "var(--colors-color-palette-secondary)",
    }
  `)

  const getVar = dictionary.view.get
  expect(getVar('colors.colorPalette.light.accent.secondary')).toMatchInlineSnapshot(
    `"var(--colors-color-palette-light-accent-secondary)"`,
  )

  expect(Array.from(dictionary.view.colorPalettes.keys())).toMatchInlineSnapshot(`
    [
      "button",
      "button.light",
      "button.light.accent",
    ]
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
    .registerTokens()
    .registerTransform(...transforms)
    .registerMiddleware(addVirtualPalette)
    .build()

  expect(dictionary.view.colorPalettes).toMatchInlineSnapshot(`
    Map {
      "brand" => Map {
        "--colors-color-palette" => "var(--colors-brand)",
        "--colors-color-palette-hot" => "var(--colors-brand-hot)",
        "--colors-color-palette-hot-er" => "var(--colors-brand-hot-er)",
      },
      "brand.hot" => Map {
        "--colors-color-palette" => "var(--colors-brand-hot)",
        "--colors-color-palette-er" => "var(--colors-brand-hot-er)",
      },
    }
  `)
})

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

  dictionary.formatTokenName = (path: string[]) => '$' + path.join('-')
  dictionary.formatCssVar = (path, _options) => {
    const variable = dasherize(path.join('-'))
    return {
      var: `--${variable}`,
      ref: `var(--${variable})`,
    }
  }

  dictionary
    .registerTokens()
    .registerTransform(...transforms)
    .registerMiddleware(addVirtualPalette)
    .build()

  expect(dictionary.allTokens).toMatchInlineSnapshot(`
    [
      Token {
        "description": undefined,
        "extensions": {
          "category": "colors",
          "colorPalette": "$primary",
          "colorPaletteRoots": [
            [
              "primary",
            ],
          ],
          "colorPaletteTokenKeys": [
            [
              "",
            ],
          ],
          "condition": "base",
          "prop": "$primary",
          "var": "--colors-primary",
          "varRef": "var(--colors-primary)",
        },
        "name": "$colors-primary",
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
          "colorPalette": "$red",
          "colorPaletteRoots": [
            [
              "red",
            ],
          ],
          "colorPaletteTokenKeys": [
            [
              "300",
            ],
          ],
          "condition": "base",
          "prop": "$red-300",
          "var": "--colors-red-300",
          "varRef": "var(--colors-red-300)",
        },
        "name": "$colors-red-300",
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
          "colorPalette": "$red",
          "colorPaletteRoots": [
            [
              "red",
            ],
          ],
          "colorPaletteTokenKeys": [
            [
              "500",
            ],
          ],
          "condition": "base",
          "prop": "$red-500",
          "var": "--colors-red-500",
          "varRef": "var(--colors-red-500)",
        },
        "name": "$colors-red-500",
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
          "colorPalette": "$blue",
          "colorPaletteRoots": [
            [
              "blue",
            ],
          ],
          "colorPaletteTokenKeys": [
            [
              "500",
            ],
          ],
          "condition": "base",
          "prop": "$blue-500",
          "var": "--colors-blue-500",
          "varRef": "var(--colors-blue-500)",
        },
        "name": "$colors-blue-500",
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
          "colorPalette": "$blue",
          "colorPaletteRoots": [
            [
              "blue",
            ],
          ],
          "colorPaletteTokenKeys": [
            [
              "700",
            ],
          ],
          "condition": "base",
          "prop": "$blue-700",
          "var": "--colors-blue-700",
          "varRef": "var(--colors-blue-700)",
        },
        "name": "$colors-blue-700",
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
          "prop": "$colorPalette",
          "var": "--colors-colorPalette",
          "varRef": "var(--colors-colorPalette)",
        },
        "name": "$colors-colorPalette",
        "originalValue": "$colors-colorPalette",
        "path": [
          "colors",
          "colorPalette",
          "",
        ],
        "type": "color",
        "value": "$colors-colorPalette",
      },
      Token {
        "description": undefined,
        "extensions": {
          "category": "colors",
          "condition": "base",
          "isVirtual": true,
          "prop": "$colorPalette-300",
          "var": "--colors-colorPalette-300",
          "varRef": "var(--colors-colorPalette-300)",
        },
        "name": "$colors-colorPalette-300",
        "originalValue": "$colors-colorPalette-300",
        "path": [
          "colors",
          "colorPalette",
          "300",
        ],
        "type": "color",
        "value": "$colors-colorPalette-300",
      },
      Token {
        "description": undefined,
        "extensions": {
          "category": "colors",
          "condition": "base",
          "isVirtual": true,
          "prop": "$colorPalette-500",
          "var": "--colors-colorPalette-500",
          "varRef": "var(--colors-colorPalette-500)",
        },
        "name": "$colors-colorPalette-500",
        "originalValue": "$colors-colorPalette-500",
        "path": [
          "colors",
          "colorPalette",
          "500",
        ],
        "type": "color",
        "value": "$colors-colorPalette-500",
      },
      Token {
        "description": undefined,
        "extensions": {
          "category": "colors",
          "condition": "base",
          "isVirtual": true,
          "prop": "$colorPalette-700",
          "var": "--colors-colorPalette-700",
          "varRef": "var(--colors-colorPalette-700)",
        },
        "name": "$colors-colorPalette-700",
        "originalValue": "$colors-colorPalette-700",
        "path": [
          "colors",
          "colorPalette",
          "700",
        ],
        "type": "color",
        "value": "$colors-colorPalette-700",
      },
    ]
  `)

  expect(dictionary.view.colorPalettes).toMatchInlineSnapshot(`
    Map {
      "$primary" => Map {
        "--colors-colorPalette" => "var(--colors-primary)",
      },
      "$red" => Map {
        "--colors-colorPalette-300" => "var(--colors-red-300)",
        "--colors-colorPalette-500" => "var(--colors-red-500)",
      },
      "$blue" => Map {
        "--colors-colorPalette-500" => "var(--colors-blue-500)",
        "--colors-colorPalette-700" => "var(--colors-blue-700)",
      },
    }
  `)

  expect(dictionary.view.values).toMatchInlineSnapshot(`
    Map {
      "colors.$primary" => "var(--colors-primary)",
      "colors.$red-300" => "var(--colors-red-300)",
      "colors.$red-500" => "var(--colors-red-500)",
      "colors.$blue-500" => "var(--colors-blue-500)",
      "colors.$blue-700" => "var(--colors-blue-700)",
      "colors.$colorPalette" => "var(--colors-colorPalette)",
      "colors.$colorPalette-300" => "var(--colors-colorPalette-300)",
      "colors.$colorPalette-500" => "var(--colors-colorPalette-500)",
      "colors.$colorPalette-700" => "var(--colors-colorPalette-700)",
    }
  `)

  const getVar = dictionary.view.get
  expect(getVar('colors.colorPalette.300')).toMatchInlineSnapshot(`undefined`)

  expect(Array.from(dictionary.view.colorPalettes.keys())).toMatchInlineSnapshot(`
    [
      "$primary",
      "$red",
      "$blue",
    ]
  `)
})

test('should generate nested object virtual palette + custom formatTokenName', () => {
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

  dictionary.formatTokenName = (path: string[]) => '$' + path.join('-')
  dictionary
    .registerTokens()
    .registerTransform(...transforms)
    .registerMiddleware(addVirtualPalette)
    .build()

  expect(dictionary.allTokens).toMatchInlineSnapshot(`
    [
      Token {
        "description": undefined,
        "extensions": {
          "category": "colors",
          "colorPalette": "$button",
          "colorPaletteRoots": [
            [
              "button",
            ],
          ],
          "colorPaletteTokenKeys": [
            [
              "dark",
            ],
          ],
          "condition": "base",
          "conditions": {
            "base": "navy",
          },
          "prop": "$button-dark",
          "var": "--colors-button-dark",
          "varRef": "var(--colors-button-dark)",
        },
        "name": "$colors-button-dark",
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
          "colorPalette": "$button",
          "colorPaletteRoots": [
            [
              "button",
            ],
          ],
          "colorPaletteTokenKeys": [
            [
              "light",
            ],
          ],
          "condition": "base",
          "conditions": {
            "base": "skyblue",
          },
          "isDefault": true,
          "prop": "$button-light",
          "var": "--colors-button-light",
          "varRef": "var(--colors-button-light)",
        },
        "name": "$colors-button-light",
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
          "colorPalette": "$button-light",
          "colorPaletteRoots": [
            [
              "button",
            ],
            [
              "button",
              "light",
            ],
          ],
          "colorPaletteTokenKeys": [
            [
              "light",
              "accent",
            ],
            [
              "accent",
            ],
          ],
          "condition": "base",
          "conditions": {
            "base": "cyan",
          },
          "isDefault": true,
          "prop": "$button-light-accent",
          "var": "--colors-button-light-accent",
          "varRef": "var(--colors-button-light-accent)",
        },
        "name": "$colors-button-light-accent",
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
          "colorPalette": "$button-light-accent",
          "colorPaletteRoots": [
            [
              "button",
            ],
            [
              "button",
              "light",
            ],
            [
              "button",
              "light",
              "accent",
            ],
          ],
          "colorPaletteTokenKeys": [
            [
              "light",
              "accent",
              "secondary",
            ],
            [
              "accent",
              "secondary",
            ],
            [
              "secondary",
            ],
          ],
          "condition": "base",
          "conditions": {
            "base": "blue",
          },
          "prop": "$button-light-accent-secondary",
          "var": "--colors-button-light-accent-secondary",
          "varRef": "var(--colors-button-light-accent-secondary)",
        },
        "name": "$colors-button-light-accent-secondary",
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
          "prop": "$colorPalette-dark",
          "var": "--colors-color-palette-dark",
          "varRef": "var(--colors-color-palette-dark)",
        },
        "name": "$colors-colorPalette-dark",
        "originalValue": "$colors-colorPalette-dark",
        "path": [
          "colors",
          "colorPalette",
          "dark",
        ],
        "type": "color",
        "value": "$colors-colorPalette-dark",
      },
      Token {
        "description": undefined,
        "extensions": {
          "category": "colors",
          "condition": "base",
          "isVirtual": true,
          "prop": "$colorPalette-light",
          "var": "--colors-color-palette-light",
          "varRef": "var(--colors-color-palette-light)",
        },
        "name": "$colors-colorPalette-light",
        "originalValue": "$colors-colorPalette-light",
        "path": [
          "colors",
          "colorPalette",
          "light",
        ],
        "type": "color",
        "value": "$colors-colorPalette-light",
      },
      Token {
        "description": undefined,
        "extensions": {
          "category": "colors",
          "condition": "base",
          "isVirtual": true,
          "prop": "$colorPalette",
          "var": "--colors-color-palette",
          "varRef": "var(--colors-color-palette)",
        },
        "name": "$colors-colorPalette",
        "originalValue": "$colors-colorPalette",
        "path": [
          "colors",
          "colorPalette",
        ],
        "type": "color",
        "value": "$colors-colorPalette",
      },
      Token {
        "description": undefined,
        "extensions": {
          "category": "colors",
          "condition": "base",
          "isVirtual": true,
          "prop": "$colorPalette-light-accent",
          "var": "--colors-color-palette-light-accent",
          "varRef": "var(--colors-color-palette-light-accent)",
        },
        "name": "$colors-colorPalette-light-accent",
        "originalValue": "$colors-colorPalette-light-accent",
        "path": [
          "colors",
          "colorPalette",
          "light",
          "accent",
        ],
        "type": "color",
        "value": "$colors-colorPalette-light-accent",
      },
      Token {
        "description": undefined,
        "extensions": {
          "category": "colors",
          "condition": "base",
          "isVirtual": true,
          "prop": "$colorPalette-accent",
          "var": "--colors-color-palette-accent",
          "varRef": "var(--colors-color-palette-accent)",
        },
        "name": "$colors-colorPalette-accent",
        "originalValue": "$colors-colorPalette-accent",
        "path": [
          "colors",
          "colorPalette",
          "accent",
        ],
        "type": "color",
        "value": "$colors-colorPalette-accent",
      },
      Token {
        "description": undefined,
        "extensions": {
          "category": "colors",
          "condition": "base",
          "isVirtual": true,
          "prop": "$colorPalette",
          "var": "--colors-color-palette",
          "varRef": "var(--colors-color-palette)",
        },
        "name": "$colors-colorPalette",
        "originalValue": "$colors-colorPalette",
        "path": [
          "colors",
          "colorPalette",
        ],
        "type": "color",
        "value": "$colors-colorPalette",
      },
      Token {
        "description": undefined,
        "extensions": {
          "category": "colors",
          "condition": "base",
          "isVirtual": true,
          "prop": "$colorPalette-light-accent-secondary",
          "var": "--colors-color-palette-light-accent-secondary",
          "varRef": "var(--colors-color-palette-light-accent-secondary)",
        },
        "name": "$colors-colorPalette-light-accent-secondary",
        "originalValue": "$colors-colorPalette-light-accent-secondary",
        "path": [
          "colors",
          "colorPalette",
          "light",
          "accent",
          "secondary",
        ],
        "type": "color",
        "value": "$colors-colorPalette-light-accent-secondary",
      },
      Token {
        "description": undefined,
        "extensions": {
          "category": "colors",
          "condition": "base",
          "isVirtual": true,
          "prop": "$colorPalette-accent-secondary",
          "var": "--colors-color-palette-accent-secondary",
          "varRef": "var(--colors-color-palette-accent-secondary)",
        },
        "name": "$colors-colorPalette-accent-secondary",
        "originalValue": "$colors-colorPalette-accent-secondary",
        "path": [
          "colors",
          "colorPalette",
          "accent",
          "secondary",
        ],
        "type": "color",
        "value": "$colors-colorPalette-accent-secondary",
      },
      Token {
        "description": undefined,
        "extensions": {
          "category": "colors",
          "condition": "base",
          "isVirtual": true,
          "prop": "$colorPalette-secondary",
          "var": "--colors-color-palette-secondary",
          "varRef": "var(--colors-color-palette-secondary)",
        },
        "name": "$colors-colorPalette-secondary",
        "originalValue": "$colors-colorPalette-secondary",
        "path": [
          "colors",
          "colorPalette",
          "secondary",
        ],
        "type": "color",
        "value": "$colors-colorPalette-secondary",
      },
    ]
  `)

  expect(dictionary.view.colorPalettes).toMatchInlineSnapshot(`
    Map {
      "$button" => Map {
        "--colors-color-palette-dark" => "var(--colors-button-dark)",
        "--colors-color-palette-light" => "var(--colors-button-light)",
        "--colors-color-palette-light-accent" => "var(--colors-button-light-accent)",
        "--colors-color-palette-light-accent-secondary" => "var(--colors-button-light-accent-secondary)",
      },
      "$button-light" => Map {
        "--colors-color-palette" => "var(--colors-button-light)",
        "--colors-color-palette-accent" => "var(--colors-button-light-accent)",
        "--colors-color-palette-accent-secondary" => "var(--colors-button-light-accent-secondary)",
      },
      "$button-light-accent" => Map {
        "--colors-color-palette" => "var(--colors-button-light-accent)",
        "--colors-color-palette-secondary" => "var(--colors-button-light-accent-secondary)",
      },
    }
  `)

  expect(dictionary.view.values).toMatchInlineSnapshot(`
    Map {
      "colors.$button-dark" => "var(--colors-button-dark)",
      "colors.$button-light" => "var(--colors-button-light)",
      "colors.$button-light-accent" => "var(--colors-button-light-accent)",
      "colors.$button-light-accent-secondary" => "var(--colors-button-light-accent-secondary)",
      "colors.$colorPalette-dark" => "var(--colors-color-palette-dark)",
      "colors.$colorPalette-light" => "var(--colors-color-palette-light)",
      "colors.$colorPalette" => "var(--colors-color-palette)",
      "colors.$colorPalette-light-accent" => "var(--colors-color-palette-light-accent)",
      "colors.$colorPalette-accent" => "var(--colors-color-palette-accent)",
      "colors.$colorPalette-light-accent-secondary" => "var(--colors-color-palette-light-accent-secondary)",
      "colors.$colorPalette-accent-secondary" => "var(--colors-color-palette-accent-secondary)",
      "colors.$colorPalette-secondary" => "var(--colors-color-palette-secondary)",
    }
  `)

  const getVar = dictionary.view.get
  expect(getVar('colors.$colorPalette-light-accent-secondary')).toMatchInlineSnapshot(
    `"var(--colors-color-palette-light-accent-secondary)"`,
  )

  expect(Array.from(dictionary.view.colorPalettes.keys())).toMatchInlineSnapshot(`
    [
      "$button",
      "$button-light",
      "$button-light-accent",
    ]
  `)
})

test('should generate virtual palette with DEFAULT value', () => {
  const dictionary = new TokenDictionary({
    tokens: {
      colors: {
        bg: {
          primary: {
            DEFAULT: {
              value: '{colors.red.500}',
            },
            base: {
              value: '{colors.green.500}',
            },
            hover: {
              value: '{colors.yellow.300}',
            },
          },
        },
      },
    },
  })

  dictionary
    .registerTokens()
    .registerTransform(...transforms)
    .registerMiddleware(addVirtualPalette)
    .build()

  // expect(dictionary.allTokens.map((t) => [t.path.join('.'), t.value])).toMatchInlineSnapshot(`
  expect(dictionary.allTokens.map((t) => t.path.join('.'))).toMatchInlineSnapshot(`
    [
      "colors.bg.primary",
      "colors.bg.primary.base",
      "colors.bg.primary.hover",
      "colors.colorPalette.primary",
      "colors.colorPalette",
      "colors.colorPalette.primary.base",
      "colors.colorPalette.base",
      "colors.colorPalette.primary.hover",
      "colors.colorPalette.hover",
    ]
  `)

  expect(dictionary.view.colorPalettes).toMatchInlineSnapshot(`
    Map {
      "bg" => Map {
        "--colors-color-palette-primary" => "var(--colors-bg-primary)",
        "--colors-color-palette-primary-base" => "var(--colors-bg-primary-base)",
        "--colors-color-palette-primary-hover" => "var(--colors-bg-primary-hover)",
      },
      "bg.primary" => Map {
        "--colors-color-palette" => "var(--colors-bg-primary)",
        "--colors-color-palette-base" => "var(--colors-bg-primary-base)",
        "--colors-color-palette-hover" => "var(--colors-bg-primary-hover)",
      },
    }
  `)

  expect(dictionary.view.values).toMatchInlineSnapshot(`
    Map {
      "colors.bg.primary" => "var(--colors-bg-primary)",
      "colors.bg.primary.base" => "var(--colors-bg-primary-base)",
      "colors.bg.primary.hover" => "var(--colors-bg-primary-hover)",
      "colors.colorPalette.primary" => "var(--colors-color-palette-primary)",
      "colors.colorPalette" => "var(--colors-color-palette)",
      "colors.colorPalette.primary.base" => "var(--colors-color-palette-primary-base)",
      "colors.colorPalette.base" => "var(--colors-color-palette-base)",
      "colors.colorPalette.primary.hover" => "var(--colors-color-palette-primary-hover)",
      "colors.colorPalette.hover" => "var(--colors-color-palette-hover)",
    }
  `)
})
