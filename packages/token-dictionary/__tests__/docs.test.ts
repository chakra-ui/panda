import { fixturePreset } from '@pandacss/fixture'
import { expect, test } from 'vitest'
import { TokenDictionary } from '../src'
import { getTokenDocs } from '../src/docs'

test('should generate categorize token', () => {
  const dictionary = new TokenDictionary({
    tokens: fixturePreset.theme.tokens,
    semanticTokens: fixturePreset.theme.semanticTokens,
  })

  expect(getTokenDocs(dictionary.filter({ isConditional: true, extensions: { category: 'colors' } })))
    .toMatchInlineSnapshot(`
      {
        "colors": {
          "button": [
            Token {
              "description": undefined,
              "extensions": {
                "category": "colors",
                "colorPalette": "button",
                "colorPaletteRoots": [
                  "button",
                ],
                "colorPaletteTokenKeys": [
                  "thick",
                ],
                "condition": "base",
                "conditions": {
                  "_dark": "#000",
                  "base": "#fff",
                },
                "prop": "button.thick",
                "var": "--colors-button-thick",
                "varRef": "var(--colors-button-thick)",
              },
              "name": "colors.button.thick",
              "originalValue": "#fff",
              "path": [
                "colors",
                "button",
                "thick",
              ],
              "type": "color",
              "value": "#fff",
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
                  "thick",
                ],
                "condition": "_dark",
                "conditions": {
                  "_dark": "#000",
                  "base": "#fff",
                },
                "prop": "button.thick",
                "var": "--colors-button-thick",
                "varRef": "var(--colors-button-thick)",
              },
              "name": "colors.button.thick",
              "originalValue": "#fff",
              "path": [
                "colors",
                "button",
                "thick",
              ],
              "type": "color",
              "value": "#000",
            },
          ],
          "button.card": [
            Token {
              "description": undefined,
              "extensions": {
                "category": "colors",
                "colorPalette": "button.card",
                "colorPaletteRoots": [
                  "button",
                  "button.card",
                ],
                "colorPaletteTokenKeys": [
                  "card.body",
                  "body",
                ],
                "condition": "base",
                "conditions": {
                  "_dark": "#000",
                  "base": "#fff",
                },
                "prop": "button.card.body",
                "var": "--colors-button-card-body",
                "varRef": "var(--colors-button-card-body)",
              },
              "name": "colors.button.card.body",
              "originalValue": "#fff",
              "path": [
                "colors",
                "button",
                "card",
                "body",
              ],
              "type": "color",
              "value": "#fff",
            },
            Token {
              "description": undefined,
              "extensions": {
                "category": "colors",
                "colorPalette": "button.card",
                "colorPaletteRoots": [
                  "button",
                  "button.card",
                ],
                "colorPaletteTokenKeys": [
                  "card.body",
                  "body",
                ],
                "condition": "_dark",
                "conditions": {
                  "_dark": "#000",
                  "base": "#fff",
                },
                "prop": "button.card.body",
                "var": "--colors-button-card-body",
                "varRef": "var(--colors-button-card-body)",
              },
              "name": "colors.button.card.body",
              "originalValue": "#fff",
              "path": [
                "colors",
                "button",
                "card",
                "body",
              ],
              "type": "color",
              "value": "#000",
            },
            Token {
              "description": undefined,
              "extensions": {
                "category": "colors",
                "colorPalette": "button.card",
                "colorPaletteRoots": [
                  "button",
                  "button.card",
                ],
                "colorPaletteTokenKeys": [
                  "card.heading",
                  "heading",
                ],
                "condition": "base",
                "conditions": {
                  "_dark": "#000",
                  "base": "#fff",
                },
                "prop": "button.card.heading",
                "var": "--colors-button-card-heading",
                "varRef": "var(--colors-button-card-heading)",
              },
              "name": "colors.button.card.heading",
              "originalValue": "#fff",
              "path": [
                "colors",
                "button",
                "card",
                "heading",
              ],
              "type": "color",
              "value": "#fff",
            },
            Token {
              "description": undefined,
              "extensions": {
                "category": "colors",
                "colorPalette": "button.card",
                "colorPaletteRoots": [
                  "button",
                  "button.card",
                ],
                "colorPaletteTokenKeys": [
                  "card.heading",
                  "heading",
                ],
                "condition": "_dark",
                "conditions": {
                  "_dark": "#000",
                  "base": "#fff",
                },
                "prop": "button.card.heading",
                "var": "--colors-button-card-heading",
                "varRef": "var(--colors-button-card-heading)",
              },
              "name": "colors.button.card.heading",
              "originalValue": "#fff",
              "path": [
                "colors",
                "button",
                "card",
                "heading",
              ],
              "type": "color",
              "value": "#000",
            },
          ],
          "uncategorized": [
            Token {
              "description": undefined,
              "extensions": {
                "category": "colors",
                "colorPalette": "primary",
                "colorPaletteRoots": [
                  "primary",
                ],
                "colorPaletteTokenKeys": [
                  "",
                ],
                "condition": "base",
                "conditions": {
                  "_dark": "var(--colors-red-400)",
                  "base": "var(--colors-red-500)",
                },
                "prop": "primary",
                "var": "--colors-primary",
                "varRef": "var(--colors-primary)",
              },
              "name": "colors.primary",
              "originalValue": "{colors.red.500}",
              "path": [
                "colors",
                "primary",
              ],
              "type": "color",
              "value": "var(--colors-red-500)",
            },
            Token {
              "description": undefined,
              "extensions": {
                "category": "colors",
                "colorPalette": "primary",
                "colorPaletteRoots": [
                  "primary",
                ],
                "colorPaletteTokenKeys": [
                  "",
                ],
                "condition": "_dark",
                "conditions": {
                  "_dark": "var(--colors-red-400)",
                  "base": "var(--colors-red-500)",
                },
                "prop": "primary",
                "var": "--colors-primary",
                "varRef": "var(--colors-primary)",
              },
              "name": "colors.primary",
              "originalValue": "{colors.red.500}",
              "path": [
                "colors",
                "primary",
              ],
              "type": "color",
              "value": "var(--colors-red-400)",
            },
            Token {
              "description": undefined,
              "extensions": {
                "category": "colors",
                "colorPalette": "secondary",
                "colorPaletteRoots": [
                  "secondary",
                ],
                "colorPaletteTokenKeys": [
                  "",
                ],
                "condition": "base",
                "conditions": {
                  "_dark": "var(--colors-red-700)",
                  "base": "var(--colors-red-800)",
                },
                "prop": "secondary",
                "var": "--colors-secondary",
                "varRef": "var(--colors-secondary)",
              },
              "name": "colors.secondary",
              "originalValue": "{colors.red.800}",
              "path": [
                "colors",
                "secondary",
              ],
              "type": "color",
              "value": "var(--colors-red-800)",
            },
            Token {
              "description": undefined,
              "extensions": {
                "category": "colors",
                "colorPalette": "secondary",
                "colorPaletteRoots": [
                  "secondary",
                ],
                "colorPaletteTokenKeys": [
                  "",
                ],
                "condition": "_dark",
                "conditions": {
                  "_dark": "var(--colors-red-700)",
                  "base": "var(--colors-red-800)",
                },
                "prop": "secondary",
                "var": "--colors-secondary",
                "varRef": "var(--colors-secondary)",
              },
              "name": "colors.secondary",
              "originalValue": "{colors.red.800}",
              "path": [
                "colors",
                "secondary",
              ],
              "type": "color",
              "value": "var(--colors-red-700)",
            },
            Token {
              "description": undefined,
              "extensions": {
                "category": "colors",
                "colorPalette": "complex",
                "colorPaletteRoots": [
                  "complex",
                ],
                "colorPaletteTokenKeys": [
                  "",
                ],
                "condition": "base",
                "conditions": {
                  "_dark": {
                    "_highContrast": "var(--colors-red-700)",
                  },
                  "base": "var(--colors-red-800)",
                },
                "prop": "complex",
                "var": "--colors-complex",
                "varRef": "var(--colors-complex)",
              },
              "name": "colors.complex",
              "originalValue": "{colors.red.800}",
              "path": [
                "colors",
                "complex",
              ],
              "type": "color",
              "value": "var(--colors-red-800)",
            },
            Token {
              "description": undefined,
              "extensions": {
                "category": "colors",
                "colorPalette": "complex",
                "colorPaletteRoots": [
                  "complex",
                ],
                "colorPaletteTokenKeys": [
                  "",
                ],
                "condition": "_dark:_highContrast",
                "conditions": {
                  "_dark": {
                    "_highContrast": "var(--colors-red-700)",
                  },
                  "base": "var(--colors-red-800)",
                },
                "prop": "complex",
                "var": "--colors-complex",
                "varRef": "var(--colors-complex)",
              },
              "name": "colors.complex",
              "originalValue": "{colors.red.800}",
              "path": [
                "colors",
                "complex",
              ],
              "type": "color",
              "value": "var(--colors-red-700)",
            },
            Token {
              "description": undefined,
              "extensions": {
                "category": "colors",
                "colorPalette": "surface",
                "colorPaletteRoots": [
                  "surface",
                ],
                "colorPaletteTokenKeys": [
                  "",
                ],
                "condition": "_materialTheme",
                "conditions": {
                  "_materialTheme": {
                    "_dark": "#m-d",
                    "base": "#m-b",
                  },
                  "_pastelTheme": {
                    "_dark": {
                      "md": "#p-d",
                    },
                    "base": "#p-b",
                  },
                },
                "prop": "surface",
                "var": "--colors-surface",
                "varRef": "var(--colors-surface)",
              },
              "name": "colors.surface",
              "originalValue": "",
              "path": [
                "colors",
                "surface",
              ],
              "type": "color",
              "value": "#m-b",
            },
            Token {
              "description": undefined,
              "extensions": {
                "category": "colors",
                "colorPalette": "surface",
                "colorPaletteRoots": [
                  "surface",
                ],
                "colorPaletteTokenKeys": [
                  "",
                ],
                "condition": "_materialTheme:_dark",
                "conditions": {
                  "_materialTheme": {
                    "_dark": "#m-d",
                    "base": "#m-b",
                  },
                  "_pastelTheme": {
                    "_dark": {
                      "md": "#p-d",
                    },
                    "base": "#p-b",
                  },
                },
                "prop": "surface",
                "var": "--colors-surface",
                "varRef": "var(--colors-surface)",
              },
              "name": "colors.surface",
              "originalValue": "",
              "path": [
                "colors",
                "surface",
              ],
              "type": "color",
              "value": "#m-d",
            },
            Token {
              "description": undefined,
              "extensions": {
                "category": "colors",
                "colorPalette": "surface",
                "colorPaletteRoots": [
                  "surface",
                ],
                "colorPaletteTokenKeys": [
                  "",
                ],
                "condition": "_pastelTheme",
                "conditions": {
                  "_materialTheme": {
                    "_dark": "#m-d",
                    "base": "#m-b",
                  },
                  "_pastelTheme": {
                    "_dark": {
                      "md": "#p-d",
                    },
                    "base": "#p-b",
                  },
                },
                "prop": "surface",
                "var": "--colors-surface",
                "varRef": "var(--colors-surface)",
              },
              "name": "colors.surface",
              "originalValue": "",
              "path": [
                "colors",
                "surface",
              ],
              "type": "color",
              "value": "#p-b",
            },
            Token {
              "description": undefined,
              "extensions": {
                "category": "colors",
                "colorPalette": "surface",
                "colorPaletteRoots": [
                  "surface",
                ],
                "colorPaletteTokenKeys": [
                  "",
                ],
                "condition": "_pastelTheme:_dark:md",
                "conditions": {
                  "_materialTheme": {
                    "_dark": "#m-d",
                    "base": "#m-b",
                  },
                  "_pastelTheme": {
                    "_dark": {
                      "md": "#p-d",
                    },
                    "base": "#p-b",
                  },
                },
                "prop": "surface",
                "var": "--colors-surface",
                "varRef": "var(--colors-surface)",
              },
              "name": "colors.surface",
              "originalValue": "",
              "path": [
                "colors",
                "surface",
              ],
              "type": "color",
              "value": "#p-d",
            },
          ],
        },
      }
    `)
})
