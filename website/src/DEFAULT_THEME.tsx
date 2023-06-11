import { css } from '@/styled-system/css'
import { useRouter } from 'next/router'
import { DiscordIcon, GitHubIcon } from 'nextra/icons'
import {
  DEFAULT_LOCALE,
  DocsThemeConfig,
  LOADING_LOCALES,
  PLACEHOLDER_LOCALES
} from './constants'
import { getGitIssueUrl, useGitEditUrl } from './nextra/lib'
import { Anchor, Flexsearch, Footer, Navbar, TOC } from './nextra'
import { useConfig } from './nextra/contexts'
import { MatchSorterSearch } from './nextra/match-sorter-search'
import { ThemeSwitch } from './nextra/theme-switch'

export const DEFAULT_THEME: DocsThemeConfig = {
  banner: {
    dismissible: true,
    key: 'nextra-banner'
  },
  chat: {
    icon: (
      <>
        <DiscordIcon />
        <span className={css({ srOnly: true })}>Discord</span>
      </>
    )
  },
  darkMode: true,
  direction: 'ltr',
  docsRepositoryBase: 'https://github.com/shuding/nextra',
  editLink: {
    component: function EditLink({ className, filePath, children }) {
      const editUrl = useGitEditUrl(filePath)
      if (!editUrl) {
        return null
      }
      return (
        <Anchor className={className} href={editUrl}>
          {children}
        </Anchor>
      )
    },
    text: 'Edit this page'
  },
  feedback: {
    content: 'Question? Give us feedback →',
    labels: 'feedback',
    useLink() {
      const config = useConfig()
      return getGitIssueUrl({
        labels: config.feedback.labels,
        repository: config.docsRepositoryBase,
        title: `Feedback for “${config.title}”`
      })
    }
  },
  footer: {
    component: Footer,
    text: `MIT ${new Date().getFullYear()} © Nextra.`
  },
  gitTimestamp: function GitTimestamp({ timestamp }) {
    const { locale = DEFAULT_LOCALE } = useRouter()
    return (
      <>
        Last updated on{' '}
        <time dateTime={timestamp.toISOString()}>
          {timestamp.toLocaleDateString(locale, {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </time>
      </>
    )
  },
  head: (
    <>
      <meta name="msapplication-TileColor" content="#fff" />
      <meta httpEquiv="Content-Language" content="en" />
      <meta name="description" content="Nextra: the next docs builder" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@shuding_" />
      <meta property="og:title" content="Nextra: the next docs builder" />
      <meta property="og:description" content="Nextra: the next docs builder" />
      <meta name="apple-mobile-web-app-title" content="Nextra" />
    </>
  ),
  i18n: [],
  logo: (
    <>
      <span className={css({ fontWeight: 'extrabold' })}>Nextra</span>
      <span
        className={css({
          marginLeft: '2',
          display: 'none',
          fontWeight: 'normal',
          color: 'gray.600',
          md: { display: 'inline' }
        })}
      >
        The Next Docs Builder
      </span>
    </>
  ),
  logoLink: true,
  navbar: {
    component: Navbar
  },
  navigation: true,
  nextThemes: {
    defaultTheme: 'system',
    storageKey: 'theme'
  },
  notFound: {
    content: 'Submit an issue about broken link →',
    labels: 'bug'
  },
  primaryHue: {
    dark: 204,
    light: 212
  },
  project: {
    icon: (
      <>
        <GitHubIcon />
        <span className={css({ srOnly: true })}>GitHub</span>
      </>
    )
  },
  search: {
    component: function Search({ className, directories }) {
      const config = useConfig()
      return config.flexsearch ? (
        <Flexsearch className={className} />
      ) : (
        <MatchSorterSearch className={className} directories={directories} />
      )
    },
    emptyResult: (
      <span
        className={css({
          display: 'block',
          userSelect: 'none',
          padding: '8',
          textAlign: 'center',
          textStyle: 'sm',
          color: 'gray.400'
        })}
      >
        No results found.
      </span>
    ),
    error: 'Failed to load search index.',
    loading: function useLoading() {
      const { locale, defaultLocale = DEFAULT_LOCALE } = useRouter()
      const text =
        (locale && LOADING_LOCALES[locale]) || LOADING_LOCALES[defaultLocale]
      return <>{text}…</>
    },
    placeholder: function usePlaceholder() {
      const { locale, defaultLocale = DEFAULT_LOCALE } = useRouter()
      const text =
        (locale && PLACEHOLDER_LOCALES[locale]) ||
        PLACEHOLDER_LOCALES[defaultLocale]
      return `${text}…`
    }
  },
  serverSideError: {
    content: 'Submit an issue about error in url →',
    labels: 'bug'
  },
  sidebar: {
    defaultMenuCollapseLevel: 2,
    titleComponent: ({ title }) => <>{title}</>,
    toggleButton: false
  },
  themeSwitch: {
    component: ThemeSwitch,
    useOptions() {
      const { locale } = useRouter()

      if (locale === 'zh-CN') {
        return { dark: '深色主题', light: '浅色主题', system: '系统默认' }
      }
      return { dark: 'Dark', light: 'Light', system: 'System' }
    }
  },
  toc: {
    component: TOC,
    float: true,
    title: 'On This Page'
  },
  useNextSeoProps: () => ({ titleTemplate: '%s – Nextra' })
}
