import type { Context } from '@pandacss/core'
import { compact } from '@pandacss/shared'
import type { ThemeVariant } from '@pandacss/types'
import { ArtifactFile } from '../artifact'
import { stringifyVars } from '../css/token-css'

const getThemeId = (themeName: string) => 'panda-theme-' + themeName

export function generateThemes(ctx: Context) {
  const { themes } = ctx.config
  if (!themes) return

  const { tokens, conditions } = ctx

  return Object.entries(themes).map(([name, _themeVariant]) => {
    const results = [] as string[]
    const condName = ctx.conditions.getThemeName(name)

    for (const [key, values] of tokens.view.vars.entries()) {
      if (key.startsWith(condName)) {
        const css = stringifyVars({ values, conditionKey: key, root: '', conditions })
        if (css) {
          results.push(css)
        }
      }
    }

    return {
      name,
      json: JSON.stringify(
        compact({
          name,
          id: getThemeId(name),
          css: results.join('\n\n'),
        }),
        null,
        2,
      ),
    }
  })
}

export const themesIndexJsArtifact = new ArtifactFile({
  id: 'themes/index.js',
  fileName: 'index',
  type: 'js',
  dir: (ctx) => ctx.paths.themes,
  dependencies: ['themes'],
  code() {
    return `
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
    }`
  },
})

export const themesIndexDtsArtifact = new ArtifactFile({
  id: 'themes/index.d.ts',
  fileName: 'index',
  type: 'dts',
  dir: (ctx) => ctx.paths.themes,
  dependencies: ['themes'],
  computed(ctx) {
    const { themes } = ctx.config
    const files = generateThemes(ctx)
    return { themes, files }
  },
  code(params) {
    const { themes, files } = params.computed
    if (!themes) return
    if (!files) return

    const themeName = Object.keys(themes)

    return `
    export type ThemeName = ${themeName.map((name) => `'${name}'`).join(' | ')}
    export type ThemeByName = {
      ${files
        .map((f) => {
          const theme = JSON.parse(f.json) as GeneratedTheme
          if (!theme.css) return ''
          return `'${f.name}': {
            id: string,
            name: '${f.name}',
            css: string
          }`
        })
        .join('\n')}
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
    `
  },
})

interface GeneratedTheme extends Omit<ThemeVariant, 'tokens' | 'semanticTokens'> {
  name: string
  id: string
  css: string
}
