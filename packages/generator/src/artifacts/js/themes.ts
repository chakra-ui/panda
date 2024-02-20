import type { Context } from '@pandacss/core'
import outdent from 'outdent'

export function generateThemes(ctx: Context) {
  const { themes } = ctx.config
  if (!themes) return
  const dict = ctx.tokens

  return Object.entries(themes).map(([name, themeVariant]) => {
    const vars = new Map<string, string>()

    dict
      .filter((p) => {
        return p.extensions.theme === name
      })
      .forEach((token) => {
        const { varRef, isVirtual, theme } = token.extensions
        if (!theme && isVirtual) return

        const value = token.extensions.isSemantic ? varRef : token.value
        vars.set(token.extensions.var, value)
      })

    return {
      name,
      json: JSON.stringify(
        {
          name,
          selector: themeVariant.selector,
          vars: Object.fromEntries(vars),
        },
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
  export const getTheme = (themeName) => import('./' + themeName + '.json')
  `,
    },
    {
      file: ctx.file.extDts('index'),
      code: outdent`
  export type ThemeName = ${themeName.map((name) => `'${name}'`).join(' | ')}
  export type ThemeByName = {
    ${files
      .map((f) => {
        const theme = JSON.parse(f.json) as { vars: Record<string, string> }
        const vars = Object.keys(theme.vars)
        if (!vars.length) return ''
        return `'${f.name}': { name: '${f.name}', selector: string; vars: Record<${vars
          .map((varName) => `'${varName}'`)
          .join('|')}, string> }`
      })
      .join('\n')}
  }

  export type Theme<T extends ThemeName> = ThemeByName[T]

  export declare function getTheme<T extends ThemeName>(themeName: T): Promise<ThemeByName[T]>
  `,
    },
  ]
}
