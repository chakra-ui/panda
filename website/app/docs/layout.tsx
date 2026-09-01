import { DocsNavbar } from '@/components/docs/docs-navbar'
import { MobileBrowse } from '@/components/docs/mobile-browse'
import { TabBar } from '@/components/docs/tab-bar'
import { SiteFooter } from '@/components/docs/site-footer'
import { SkipNavContent, SkipNavLink } from '@/mdx/skip-nav'
import { css } from '@/styled-system/css'

export default function DocsLayout(props: React.PropsWithChildren) {
  const { children } = props
  return (
    <div
      id="__next"
      className={css({
        '--navbar-height': '4rem',
        '--menu-height': '3.75rem',
        '--banner-height': { base: '3.5rem', md: '2.5rem' },
        '--tabbar-height': '2.75rem'
      })}
    >
      <SkipNavLink styled />
      <DocsNavbar />
      <div
        className={css({
          position: 'fixed',
          insetX: '0',
          top: 'calc(var(--navbar-height) + var(--banner-height))',
          zIndex: '10',
          bg: 'bg',
        })}
      >
        <TabBar />
      </div>
      <main
        className={css({
          pt: 'calc(var(--navbar-height) + var(--banner-height) + var(--tabbar-height))',
          position: 'relative'
        })}
      >
        <SkipNavContent />
        {children}
      </main>
      <MobileBrowse />
      <SiteFooter />
    </div>
  )
}
