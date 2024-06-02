import { createContext, createGeneratorContext } from '@pandacss/fixture'
import { describe, expect, test } from 'vitest'
import { generateThemes, themesIndexJsArtifact, themesIndexDtsArtifact } from '../src/artifacts/js/themes'
import type { Config } from '@pandacss/types'
import { ArtifactMap } from '../src/artifacts/artifact'

const generateThemesIndex = (userConfig?: Config) => {
  return new ArtifactMap()
    .addFile(themesIndexJsArtifact)
    .addFile(themesIndexDtsArtifact)
    .generate(createGeneratorContext(userConfig))
}

describe('generate themes', () => {
  const config: Config = {
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
  }

  test('generateThemes', () => {
    const ctx = createContext(config)

    const files = generateThemes(ctx)
    expect(files).toMatchInlineSnapshot(`
      [
        {
          "json": "{
        "name": "default",
        "id": "panda-theme-default",
        "css": " [data-panda-theme=default] {\\n    --colors-primary: blue;\\n    --colors-simple: var(--colors-red-600);\\n    --colors-text: var(--colors-blue-600)\\n}\\n\\n@media (prefers-color-scheme: dark) {\\n      [data-panda-theme=default] {\\n        --colors-text: var(--colors-blue-400)\\n            }\\n        }"
      }",
          "name": "default",
        },
        {
          "json": "{
        "name": "pink",
        "id": "panda-theme-pink",
        "css": " [data-panda-theme=pink] {\\n    --colors-primary: pink;\\n    --colors-text: var(--colors-pink-600)\\n}\\n\\n@media (prefers-color-scheme: dark) {\\n      [data-panda-theme=pink] {\\n        --colors-text: var(--colors-pink-400)\\n            }\\n        }"
      }",
          "name": "pink",
        },
      ]
    `)
  })

  test('generateThemesIndex', () => {
    expect(generateThemesIndex(config)).toMatchInlineSnapshot(`
      [
        {
          "content": "/* eslint-disable */

          export type ThemeName = 'default' | 'pink'
          export type ThemeByName = {
            'default': {
                  id: string,
                  name: 'default',
                  css: string
                }
      'pink': {
                  id: string,
                  name: 'pink',
                  css: string
                }
          }

          export type Theme<T extends ThemeName> = ThemeByName[T]

          /**
           * Dynamically import a theme by name
           */
          export declare function getTheme<T extends ThemeName>(themeName: T): Promise<ThemeByName[T]>

          /**
           * Inject a theme stylesheet into the document
           */
          export declare function injectTheme(el: HTMLElement, theme: Theme<any>): HTMLStyleElement
          ",
          "id": "themes/index.d.ts",
          "path": [
            "styled-system",
            "themes",
            "index.d.ts",
          ],
        },
        {
          "content": "
          export const getTheme = (themeName) => import('./' + themeName + '.json').then((m) => m.default)

          export function injectTheme(el, theme) {
            const doc = el.ownerDocument || document
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

            el.dataset.pandaTheme = theme.name

            head.appendChild(sheet)
            sheet.innerHTML = theme.css

            return sheet
          }",
          "id": "themes/index.js",
          "path": [
            "styled-system",
            "themes",
            "index.mjs",
          ],
        },
      ]
    `)
  })
})
