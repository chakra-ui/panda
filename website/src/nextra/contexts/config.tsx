import { DEFAULT_THEME } from '@/DEFAULT_THEME'
import { DEEP_OBJECT_KEYS, DocsThemeConfig, themeSchema } from '@/constants'
import { Context } from '@/types'
import { ThemeProvider } from 'next-themes'
import type { FrontMatter, PageMapItem, PageOpts } from 'nextra'
import { metaSchema } from 'nextra/normalize-pages'
import { createContext, useContext, useState } from 'react'
import type { ZodError } from 'zod'
import { MenuProvider } from './menu'

type Config<FrontMatterType = FrontMatter> = DocsThemeConfig &
  Pick<
    PageOpts<FrontMatterType>,
    'flexsearch' | 'newNextLinkBehavior' | 'title' | 'frontMatter'
  >

const ConfigContext = createContext<Config>({
  title: '',
  frontMatter: {},
  ...DEFAULT_THEME
})

export function useConfig<FrontMatterType = FrontMatter>() {
  // @ts-expect-error TODO: fix Type 'Config<{ [key: string]: any; }>' is not assignable to type 'Config<FrontMatterType>'.
  return useContext<Config<FrontMatterType>>(ConfigContext)
}

let theme: DocsThemeConfig
let isValidated = false

function normalizeZodMessage(error: unknown): string {
  return (error as ZodError).issues
    .flatMap(issue => {
      const themePath =
        issue.path.length > 0 && `Path: "${issue.path.join('.')}"`
      const unionErrors =
        'unionErrors' in issue ? issue.unionErrors.map(normalizeZodMessage) : []
      return [
        [issue.message, themePath].filter(Boolean).join('. '),
        ...unionErrors
      ]
    })
    .join('\n')
}

function validateMeta(pageMap: PageMapItem[]) {
  for (const pageMapItem of pageMap) {
    if (pageMapItem.kind === 'Meta') {
      for (const [key, data] of Object.entries(pageMapItem.data)) {
        try {
          metaSchema.parse(data)
        } catch (error) {
          console.error(
            `[nextra-theme-docs] Error validating _meta.json file for "${key}" property.\n\n${normalizeZodMessage(
              error
            )}`
          )
        }
      }
    } else if (pageMapItem.kind === 'Folder') {
      validateMeta(pageMapItem.children)
    }
  }
}

export const ConfigProvider = ({
  children,
  value: { themeConfig, pageOpts }
}: {
  children: React.ReactNode
  value: Context
}) => {
  const [menu, setMenu] = useState(false)
  // Merge only on first load
  theme ||= {
    ...DEFAULT_THEME,
    ...Object.fromEntries(
      Object.entries(themeConfig ?? {}).map(([key, value]) => [
        key,
        value && typeof value === 'object' && DEEP_OBJECT_KEYS.includes(key)
          ? { ...DEFAULT_THEME[key], ...value }
          : value
      ])
    )
  }
  if (process.env.NODE_ENV !== 'production' && !isValidated) {
    try {
      themeSchema.parse(theme)
    } catch (error) {
      console.error(
        `[nextra-theme-docs] Error validating theme config file.\n\n${normalizeZodMessage(
          error
        )}`
      )
    }
    validateMeta(pageOpts.pageMap)
    isValidated = true
  }
  const extendedConfig: Config = {
    ...theme,
    flexsearch: pageOpts.flexsearch,
    ...(typeof pageOpts.newNextLinkBehavior === 'boolean' && {
      newNextLinkBehavior: pageOpts.newNextLinkBehavior
    }),
    title: pageOpts.title,
    frontMatter: pageOpts.frontMatter
  }

  const { nextThemes } = extendedConfig

  return (
    <ThemeProvider
      attribute="class"
      disableTransitionOnChange
      defaultTheme={nextThemes.defaultTheme}
      storageKey={nextThemes.storageKey}
      forcedTheme={nextThemes.forcedTheme}
    >
      <ConfigContext.Provider value={extendedConfig}>
        <MenuProvider value={{ menu, setMenu }}>{children}</MenuProvider>
      </ConfigContext.Provider>
    </ThemeProvider>
  )
}
