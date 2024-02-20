import { createContext } from '@pandacss/fixture'
import { describe, expect, test } from 'vitest'
import { generateThemes, generateThemesIndex } from '../src/artifacts/js/themes'

describe('generate themes', () => {
  test('generateThemes', () => {
    const ctx = createContext({
      themes: {
        default: {
          selector: 'theme-default',
          tokens: {
            colors: {
              primary: { value: 'blue' },
            },
          },
          semanticTokens: {
            colors: {
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
          selector: 'theme-pink',
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
        "selector": "theme-default",
        "vars": {
          "--colors-primary": "blue",
          "--colors-text": "var(--colors-text)"
        }
      }",
          "name": "default",
        },
        {
          "json": "{
        "name": "pink",
        "selector": "theme-pink",
        "vars": {
          "--colors-primary": "pink",
          "--colors-text": "var(--colors-text)"
        }
      }",
          "name": "pink",
        },
      ]
    `)

    expect(generateThemesIndex(ctx, files)).toMatchInlineSnapshot(`
      [
        {
          "code": "export const getTheme = (themeName) => import('./' + themeName + '.json')",
          "file": "index.mjs",
        },
        {
          "code": "export type ThemeName = 'default' | 'pink'
      export type ThemeByName = {
        'default': { name: 'default', selector: string; vars: Record<'--colors-primary'|'--colors-text', string> }
      'pink': { name: 'pink', selector: string; vars: Record<'--colors-primary'|'--colors-text', string> }
      }

      export type Theme<T extends ThemeName> = ThemeByName[T]

      export declare function getTheme<T extends ThemeName>(themeName: T): Promise<ThemeByName[T]>",
          "file": "index.d.ts",
        },
      ]
    `)
  })
})
