import Link from '@docusaurus/Link'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import HomepageFeatures from '@site/src/components/HomepageFeatures'
import Heading from '@theme/Heading'
import Layout from '@theme/Layout'

import { css } from '@site/styled-system/css'
import { center } from '@site/styled-system/patterns'

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext()
  return (
    <header
      className={css({
        bg: 'green.500',
        padding: { base: '2rem', lg: '4rem 0' },
        textAlign: 'center',
        pos: 'relative',
        overflow: 'hidden',
      })}
    >
      <div className="container">
        <Heading
          as="h1"
          className={css({
            textStyle: '4xl!',
          })}
        >
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={center()}>
          <Link className="button button--secondary button--lg" to="/docs/intro">
            Docusaurus Tutorial - 5min ⏱️
          </Link>
        </div>
      </div>
    </header>
  )
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext()
  return (
    <Layout title={`Hello from ${siteConfig.title}`} description="Description will go into a meta tag in <head />">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  )
}
