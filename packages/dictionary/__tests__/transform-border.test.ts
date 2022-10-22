import { expect, test } from 'vitest'
import { TokenDictionary } from '../src/dictionary'
import { addCssVariables, transformBorders } from '../src/transform'

test.only('transform / border', () => {
  const dictionary = new TokenDictionary({
    tokens: {
      colors: {
        red: { value: '#ff0000' },
      },
      borders: {
        sm: { value: '1px solid {colors.red}' },
        md: { value: { width: 2, style: 'solid', color: '{colors.red}' } },
      },
    },
    semanticTokens: {
      borders: {
        controlBorder: {
          value: { base: '{borders.sm}', '@hover': '{borders.md}' },
        },
      },
    },
  })

  dictionary.registerTransform(transformBorders, addCssVariables)

  dictionary.build()

  expect(dictionary.allTokens).toMatchInlineSnapshot(`
    [
      Token {
        "extensions": {
          "category": "colors",
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
      Token {
        "extensions": {
          "category": "borders",
          "condition": "base",
          "prop": "sm",
          "var": "--borders-sm",
          "varRef": "var(--borders-sm)",
        },
        "name": "borders.sm",
        "originalValue": "1px solid {colors.red}",
        "path": [
          "borders",
          "sm",
        ],
        "type": "border",
        "value": "1px solid #ff0000",
      },
      Token {
        "extensions": {
          "category": "borders",
          "condition": "base",
          "prop": "md",
          "var": "--borders-md",
          "varRef": "var(--borders-md)",
        },
        "name": "borders.md",
        "originalValue": {
          "color": "{colors.red}",
          "style": "solid",
          "width": 2,
        },
        "path": [
          "borders",
          "md",
        ],
        "type": "border",
        "value": "2px solid #ff0000",
      },
      Token {
        "extensions": {
          "category": "borders",
          "condition": "base",
          "prop": "controlBorder",
          "var": "--borders-control-border",
          "varRef": "var(--borders-control-border)",
        },
        "name": "borders.controlBorder",
        "originalValue": "{borders.sm}",
        "path": [
          "borders",
          "controlBorder",
        ],
        "type": "border",
        "value": "1px solid #ff0000",
      },
      Token {
        "extensions": {
          "category": "borders",
          "condition": "@hover",
          "prop": "controlBorder",
          "var": "--borders-control-border",
          "varRef": "var(--borders-control-border)",
        },
        "name": "borders.controlBorder",
        "originalValue": "{borders.sm}",
        "path": [
          "borders",
          "controlBorder",
        ],
        "type": "border",
        "value": "2px solid #ff0000",
      },
    ]
  `)
})
