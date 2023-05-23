import React from 'react'
import {
  DocsThemeConfig,
  Tabs,
  Tab,
  useConfig,
  Callout,
  FileTree,
  Steps,
  Card,
  Cards
} from './src' // nextra-theme-docs
import { useRouter } from 'next/router'
import { css } from './styled-system/css'
import { Icon } from './theme/icons'

const config: DocsThemeConfig = {
  components: {
    blockquote: Callout,
    //
    Card: Card,
    Cards: Cards,
    Callout: Callout,
    FileTree: FileTree,
    Steps: Steps,
    Tab: Tab,
    Tabs: Tabs
  },
  logo: <Icon icon="LogoWithText" />,
  project: { link: 'https://github.com/chakra-ui/panda' },
  useNextSeoProps() {
    const { route } = useRouter()

    if (route === '/') return { titleTemplate: 'Panda – %s' }

    return { titleTemplate: '%s – Panda' }
  },
  docsRepositoryBase: 'https://github.com/chakra-ui/panda/blob/website/pages',
  footer: {
    text: (
      <div
        className={css({
          display: 'flex',
          justifyContent: 'space-between',
          gap: '4',
          width: '100%'
        })}
      >
        <span>Copyright © 2023</span>
        <a
          className={css({ color: 'current', textDecoration: 'none' })}
          href="https://www.adebayosegun.com/"
        >
          Proudly made in 🇳🇬 by Segun Adebayo
        </a>
      </div>
    )
  },
  head: () => {
    const { frontMatter: meta } = useConfig()
    const { title } = meta

    return (
      <>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🐼</text></svg>"
        />
        <meta httpEquiv="Content-Language" content="en" />
        <meta
          name="description"
          content={
            meta['description'] ||
            '🐼 Universal CSS Framework for Design Systems ⚡️'
          }
        />
        <meta
          name="og:description"
          content={
            meta['description'] ||
            '🐼 Universal CSS Framework for Design Systems ⚡️'
          }
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@thesegunadebayo" />
        <meta
          name="og:title"
          content={
            title
              ? title + ' – Panda'
              : 'Panda - 🐼 Universal CSS Framework for Design Systems ⚡️'
          }
        />
        <meta name="apple-mobile-web-app-title" content="Panda" />
      </>
    )
  }
}

export default config
