import type { Context } from '@pandacss/core'
import { compact } from '@pandacss/shared'
import type { ThemeVariant } from '@pandacss/types'
import outdent from 'outdent'
import { stringifyVars } from '../css/token-css'

const getThemeId = (themeName: string) => 'panda-themes-' + themeName

export function generateThemes(ctx: Context) {
  const { themes } = ctx.config
  if (!themes) return

  const { tokens, conditions } = ctx

  return Object.entries(themes).map(([name, themeVariant]) => {
    const vars = new Map<string, string>()
    const results = [] as string[]

    tokens
      .filter((p) => {
        return p.extensions.theme === name
      })

      .forEach((token) => {
        const { varRef, isVirtual, theme } = token.extensions
        if (!theme && isVirtual) return

        const isConditional = token.extensions.condition?.includes(':')
        const value = token.extensions.isSemantic && isConditional ? varRef : token.value
        vars.set(token.extensions.var, value)
      })

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
          className: themeVariant.attribute === 'class' ? name : undefined,
          dataAttr: themeVariant.attribute === 'class' ? undefined : themeVariant.attribute || name,
          vars: Object.fromEntries(vars),
          css: results.join('\n\n'),
        }),
        null,
        2,
      ),
    }
  })
}

export function generateThemesIndex(ctx: Context, files: ReturnType<typeof generateThemes>) {
  const { themes } = ctx.config
  if (!themes) return
  if (!files) return

  const themeName = Object.keys(themes)

  return [
    {
      file: ctx.file.ext('index'),
      code: outdent`
  export const getTheme = (themeName) => import('./' + themeName + '.json').then((m) => m.default)

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

  `,
    },
    {
      file: ctx.file.extDts('index'),
      code: outdent`
  export type ThemeName = ${themeName.map((name) => `'${name}'`).join(' | ')}
  export type ThemeByName = {
    ${files
      .map((f) => {
        const theme = JSON.parse(f.json) as GeneratedTheme
        const vars = Object.keys(theme.vars)
        if (!vars.length) return ''
        return `'${f.name}': {
          id: string,
          name: '${f.name}',
          ${
            theme.attribute === 'class'
              ? `className: '${theme.attribute}',`
              : `dataAttr: '${theme.attribute || f.name}',`
          }
          css: string,
          vars: Record<${vars.map((varName) => `'${varName}'`).join('|')}, string> }`
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
  export declare function injectTheme(theme: Theme<any>, doc?: Document): HTMLStyleElement
  `,
    },
  ]
}

interface GeneratedTheme extends Omit<ThemeVariant, 'tokens' | 'semanticTokens'> {
  name: string
  vars: Record<string, string>
  css: string
}
