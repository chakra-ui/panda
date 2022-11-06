import { expect, test } from 'vitest'
import { TokenDictionary } from '../src/dictionary'
import { addConditionalCssVariables, addCssVariables, transformBorders } from '../src/transform'

test('transform / border', () => {
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
        dividerBorder: {
          value: '{borders.controlBorder}',
        },
      },
    },
  })

  dictionary.registerTransform(transformBorders, addCssVariables, addConditionalCssVariables)

  dictionary.build()

  expect(dictionary.allTokens).toMatchInlineSnapshot(`
    [
      Token {
        "description": undefined,
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
        "description": undefined,
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
        "description": undefined,
        "extensions": {
          "category": "borders",
          "condition": "base",
          "prop": "md",
          "var": "--borders-md",
          "varRef": "var(--borders-md)",
        },
        "name": "borders.md",
        "originalValue": "2px solid {colors.red}",
        "path": [
          "borders",
          "md",
        ],
        "type": "border",
        "value": "2px solid #ff0000",
      },
      Token {
        "description": undefined,
        "extensions": {
          "category": "borders",
          "condition": "base",
          "conditions": {
            "@hover": "{borders.md}",
            "base": "{borders.sm}",
          },
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
        "description": undefined,
        "extensions": {
          "category": "borders",
          "condition": "@hover",
          "conditions": {
            "@hover": "{borders.md}",
            "base": "{borders.sm}",
          },
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
      Token {
        "description": undefined,
        "extensions": {
          "category": "borders",
          "condition": "base",
          "conditions": {
            "base": "{borders.controlBorder}",
          },
          "prop": "dividerBorder",
          "var": "--borders-divider-border",
          "varRef": "var(--borders-divider-border)",
        },
        "name": "borders.dividerBorder",
        "originalValue": "{borders.controlBorder}",
        "path": [
          "borders",
          "dividerBorder",
        ],
        "type": "border",
        "value": "var(--borders-control-border)",
      },
    ]
  `)
})
