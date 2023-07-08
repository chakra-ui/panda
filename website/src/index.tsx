import 'focus-visible'
import { useRouter } from 'next/router'
import type { NextraThemeLayoutProps, PageOpts } from 'nextra'
import { useFSRoute, useMounted } from 'nextra/hooks'
import { MDXProvider } from 'nextra/mdx'
import { useMemo } from 'react'

import { css, cx } from '@/styled-system/css'
import type { PageTheme } from 'nextra/normalize-pages'
import { normalizePages } from 'nextra/normalize-pages'
import { DEFAULT_LOCALE, PartialDocsThemeConfig } from './constants'
import { renderComponent } from './nextra/lib'
import { getComponents } from './mdx-components'
import {
  Banner,
  Breadcrumb,
  Head,
  NavLinks,
  Sidebar,
  SkipNavContent
} from './nextra'
import {
  ActiveAnchorProvider,
  ConfigProvider,
  useConfig
} from './nextra/contexts'
import './resize-polyfill'

interface BodyProps {
  themeContext: PageTheme
  breadcrumb: React.ReactNode
  timestamp?: number
  navigation: React.ReactNode
  children: React.ReactNode
}

const classes = {
  toc: css({
    order: 9999,
    display: 'none',
    width: '16rem',
    flexShrink: 0,
    xl: { display: 'block' },
    _print: { display: 'none' },
    // nextra-toc
    md: {
      '& > div': {
        maskImage: `linear-gradient(to bottom, transparent, #000 20px), linear-gradient(to left, #000 10px, transparent 10px)`
      }
    }
  }),
  main: css({ w: 'full', overflowWrap: 'break-word' })
}

const Body = ({
  themeContext,
  breadcrumb,
  timestamp,
  navigation,
  children
}: BodyProps) => {
  const config = useConfig()
  const mounted = useMounted()

  if (themeContext.layout === 'raw') {
    return <div className={classes.main}>{children}</div>
  }

  const date =
    themeContext.timestamp && config.gitTimestamp && timestamp
      ? new Date(timestamp)
      : null

  const gitTimestampEl =
    // Because a user's time zone may be different from the server page
    mounted && date ? (
      <div
        className={css({
          marginTop: '12',
          marginBottom: '8',
          display: 'block',
          textStyle: 'xs',
          color: 'gray.500',
          _dark: { color: 'gray.400' },
          textAlign: 'start'
        })}
      >
        {renderComponent(config.gitTimestamp, { timestamp: date })}
      </div>
    ) : (
      <div className={css({ mt: 16 })} />
    )

  const content = (
    <>
      {children}
      {gitTimestampEl}
      {navigation}
    </>
  )

  const body = config.main?.({ children: content }) || content

  if (themeContext.layout === 'full') {
    return (
      <article
        className={cx(
          classes.main,
          css({
            display: 'flex',
            minH: 'calc(100vh - var(--nextra-navbar-height))',
            pl: 'max(env(safe-area-inset-left), 1.5rem)',
            pr: 'max(env(safe-area-inset-right), 1.5rem)'
          })
        )}
      >
        {body}
      </article>
    )
  }

  return (
    <article
      className={cx(
        classes.main,
        css({
          display: 'flex',
          minH: 'calc(100vh - var(--nextra-navbar-height))',
          minW: 0,
          justifyContent: 'center',
          pb: 8,
          pr: 'calc(env(safe-area-inset-right) - 1.5rem)'
        }),
        themeContext.typesetting === 'article' &&
          'nextra-body-typesetting-article'
      )}
    >
      <main
        className={css({
          w: 'full',
          minW: '0',
          maxW: '6xl',
          px: { base: '6', md: '12' },
          pt: '10'
        })}
      >
        {breadcrumb}
        {body}
      </main>
    </article>
  )
}

const InnerLayout = ({
  filePath,
  pageMap,
  frontMatter,
  headings,
  timestamp,
  children
}: PageOpts & { children: React.ReactNode }) => {
  const config = useConfig()
  const { locale = DEFAULT_LOCALE, defaultLocale } = useRouter()
  const fsPath = useFSRoute()

  const {
    activeType,
    activeIndex,
    activeThemeContext,
    activePath,
    topLevelNavbarItems,
    docsDirectories,
    flatDirectories,
    flatDocsDirectories,
    directories
  } = useMemo(
    () =>
      normalizePages({
        list: pageMap,
        locale,
        defaultLocale,
        route: fsPath
      }),
    [pageMap, locale, defaultLocale, fsPath]
  )

  const themeContext = { ...activeThemeContext, ...frontMatter }
  const hideSidebar =
    !themeContext.sidebar ||
    themeContext.layout === 'raw' ||
    activeType === 'page'

  const tocEl =
    activeType === 'page' ||
    !themeContext.toc ||
    themeContext.layout !== 'default' ? (
      themeContext.layout !== 'full' &&
      themeContext.layout !== 'raw' && (
        <nav className={classes.toc} aria-label="table of contents" />
      )
    ) : (
      <nav
        className={cx(classes.toc, css({ px: 4 }))}
        aria-label="table of contents"
      >
        {renderComponent(config.toc.component, {
          headings: config.toc.float ? headings : [],
          filePath
        })}
      </nav>
    )

  const localeConfig = config.i18n.find(l => l.locale === locale)
  const isRTL = localeConfig
    ? localeConfig.direction === 'rtl'
    : config.direction === 'rtl'

  const direction = isRTL ? 'rtl' : 'ltr'

  return (
    // This makes sure that selectors like `[dir=ltr] .nextra-container` work
    // before hydration as Panda expects the `dir` attribute to exist on the
    // `html` element.
    <div dir={direction}>
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.setAttribute('dir','${direction}')`
        }}
      />
      <Head />
      <Banner />
      {themeContext.navbar &&
        renderComponent(config.navbar.component, {
          flatDirectories,
          items: topLevelNavbarItems
        })}
      <div
        className={cx(
          css({ mx: 'auto', display: 'flex' }),
          themeContext.layout !== 'raw' && css({ maxW: '90rem' })
        )}
      >
        <ActiveAnchorProvider>
          <Sidebar
            docsDirectories={docsDirectories}
            flatDirectories={flatDirectories}
            fullDirectories={directories}
            headings={headings}
            asPopover={hideSidebar}
            includePlaceholder={themeContext.layout === 'default'}
          />
          {tocEl}
          <SkipNavContent />
          <Body
            themeContext={themeContext}
            breadcrumb={
              activeType !== 'page' && themeContext.breadcrumb ? (
                <Breadcrumb activePath={activePath} />
              ) : null
            }
            timestamp={timestamp}
            navigation={
              activeType !== 'page' && themeContext.pagination ? (
                <NavLinks
                  flatDirectories={flatDocsDirectories}
                  currentIndex={activeIndex}
                />
              ) : null
            }
          >
            <MDXProvider
              components={getComponents({
                isRawLayout: themeContext.layout === 'raw',
                components: config.components
              })}
            >
              {children}
            </MDXProvider>
          </Body>
        </ActiveAnchorProvider>
      </div>
      {themeContext.footer &&
        renderComponent(config.footer.component, { menu: hideSidebar })}
    </div>
  )
}

export default function Layout({
  children,
  ...context
}: NextraThemeLayoutProps) {
  return (
    <ConfigProvider value={context}>
      <InnerLayout {...context.pageOpts}>{children}</InnerLayout>
    </ConfigProvider>
  )
}

export { useTheme } from 'next-themes'
export { useMDXComponents } from 'nextra/mdx'
export { Link } from './mdx/link'
export { Steps } from './mdx/steps'
export {
  Bleed,
  Callout,
  Card,
  Cards,
  Collapse,
  FileTree,
  Navbar,
  NotFoundPage,
  ServerSideErrorPage,
  SkipNavContent,
  SkipNavLink,
  Tab,
  Tabs,
  ThemeSwitch
} from './nextra'
export { useConfig }
export type { PartialDocsThemeConfig as DocsThemeConfig }
