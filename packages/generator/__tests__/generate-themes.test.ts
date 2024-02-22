import { createContext } from '@pandacss/fixture'
import { describe, expect, test } from 'vitest'
import { generateThemes, generateThemesIndex } from '../src/artifacts/js/themes'

describe('generate themes', () => {
  test('generateThemes', () => {
    const ctx = createContext({
      themes: {
        default: {
          tokens: {
            colors: {
              primary: { value: 'blue' },
            },
          },
          semanticTokens: {
            colors: {
              simple: {
                value: '{colors.red.600}',
              },
              text: {
                value: {
                  base: '{colors.blue.600}',
                  _osDark: '{colors.blue.400}',
                },
              },
            },
          },
        },
        pink: {
          tokens: {
            colors: {
              primary: { value: 'pink' },
            },
          },
          semanticTokens: {
            colors: {
              text: {
                value: {
                  base: '{colors.pink.600}',
                  _osDark: '{colors.pink.400}',
                },
              },
            },
          },
        },
      },
    })

    const files = generateThemes(ctx)
    expect(files).toMatchInlineSnapshot(`
      [
        {
          "json": "{
        "name": "default",
        "id": "panda-themes-default",
        "dataAttr": "default",
        "vars": {
          "--colors-primary": "blue",
          "--colors-simple": "var(--colors-red-600)",
          "--colors-text": "var(--colors-text)"
        },
        "css": " [data-theme=default] {\\n    --colors-primary: blue;\\n    --colors-simple: var(--colors-red-600);\\n    --colors-text: var(--colors-blue-600)\\n}\\n\\n@media (prefers-color-scheme: dark) {\\n      [data-theme=default] {\\n        --colors-text: var(--colors-blue-400)\\n            }\\n        }"
      }",
          "name": "default",
        },
        {
          "json": "{
        "name": "pink",
        "id": "panda-themes-pink",
        "dataAttr": "pink",
        "vars": {
          "--colors-primary": "pink",
          "--colors-text": "var(--colors-text)"
        },
        "css": " [data-theme=pink] {\\n    --colors-primary: pink;\\n    --colors-text: var(--colors-pink-600)\\n}\\n\\n@media (prefers-color-scheme: dark) {\\n      [data-theme=pink] {\\n        --colors-text: var(--colors-pink-400)\\n            }\\n        }"
      }",
          "name": "pink",
        },
      ]
    `)

    expect(generateThemesIndex(ctx, files)).toMatchInlineSnapshot(`
      [
        {
          "code": "export const getTheme = (themeName) => import('./' + themeName + '.json').then((m) => m.default)

      export function injectTheme(theme, _doc) {
        const doc = _doc || document
        let sheet = doc.getElementById(theme.id)

        if (!sheet) {
          sheet = doc.createElement('style')
          sheet.setAttribute('type', 'text/css')
          sheet.setAttribute('id', theme.id)
        }

        const head = doc.head || doc.getElementsByTagName('head')[0]
        if (!head) {
          throw new Error('No head found in doc')
        }

        head.appendChild(sheet)
        sheet.innerHTML = theme.css

        return sheet
      }
      ",
          "file": "index.mjs",
        },
        {
          "code": "export type ThemeName = 'default' | 'pink'
      export type ThemeByName = {
        'default': {
                id: string,
                name: 'default',
                dataAttr: 'default',
                css: string,
                vars: Record<'--colors-primary'|'--colors-simple'|'--colors-text', string> }
      'pink': {
                id: string,
                name: 'pink',
                dataAttr: 'pink',
                css: string,
                vars: Record<'--colors-primary'|'--colors-text', string> }
      }

      export type Theme<T extends ThemeName> = ThemeByName[T]

      /**
       * Dynamically import a theme by name
       */
      export declare function getTheme<T extends ThemeName>(themeName: T): Promise<ThemeByName[T]>

      /**
       * Inject a theme stylesheet into the document
       */
      export declare function injectTheme(theme: Theme<any>, doc?: Document): HTMLStyleElement",
          "file": "index.d.ts",
        },
      ]
    `)
  })
})
