import { useRouter } from 'next/router'
import seoConfig from './seo.config'
import {
  Callout,
  Card,
  Cards,
  DocsThemeConfig,
  FileTree,
  Tab,
  Tabs,
  useConfig
} from './src'
import { Steps } from './src/mdx/steps'
import { css } from './styled-system/css'
import { Icon } from './theme/icons'
import { StatelyMachinePreview } from '@/mdx/stately-machine'

const config: DocsThemeConfig = {
  components: {
    blockquote: Callout,
    //
    Card: Card,
    Cards: Cards,
    Callout: Callout,
    FileTree: FileTree,
    StatelyMachinePreview: StatelyMachinePreview,
    Steps: Steps,
    Tab: Tab,
    Tabs: Tabs
  },
  logo: <Icon icon="LogoWithText" />,
  project: { link: 'https://github.com/chakra-ui/panda' },
  useNextSeoProps() {
    const { route } = useRouter()
    const { url, images } = seoConfig.openGraph

    if (route === '/') {
      return { titleTemplate: 'Panda – %s' }
    }

    return {
      titleTemplate: seoConfig.title.template,
      openGraph: { url, images: [{ url: `${url}${images}` }] }
    }
  },
  docsRepositoryBase: 'https://github.com/chakra-ui/panda/tree/main/website',
  sidebar: {
    toggleButton: true
  },
  // i18n: [
  //   { locale: 'en', text: 'English' },
  // ],
  footer: {
    text: (
      <div
        className={css({
          display: 'flex',
          justifyContent: 'space-between',
          gap: '4',
          width: '100%',
          fontSize: 'sm'
        })}
      >
        <span>Copyright © {new Date().getFullYear()}</span>
        <a
          className={css({ color: 'current', textDecoration: 'none' })}
          href="https://www.adebayosegun.com/"
        >
          Proudly made by the Chakra team
        </a>
      </div>
    )
  },
  head: () => {
    const { frontMatter: meta } = useConfig()
    const { title } = meta

    return (
      <>
        {seoConfig.icons.map((icon, index) => (
          <link key={index} rel={icon.rel} href={icon.url} />
        ))}
        <meta httpEquiv="Content-Language" content="en" />
        <meta
          name="description"
          content={meta['description'] || seoConfig.description}
        />
        <meta
          name="og:title"
          content={title ? title + ' – Panda' : seoConfig.title.default}
        />
        <meta
          name="og:description"
          content={meta['description'] || seoConfig.description}
        />
        <meta name="og:image" content={seoConfig.openGraph.images} />
        <meta name="og:url" content={seoConfig.openGraph.url} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content={seoConfig.twitter.site} />
        <meta name="twitter:creator" content={seoConfig.twitter.creator} />
        <meta name="apple-mobile-web-app-title" content="Panda" />
      </>
    )
  }
}

export default config
