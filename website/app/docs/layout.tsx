import { DocsNavbar } from '@/components/docs/docs-navbar'
import { MobileBrowse } from '@/components/docs/mobile-browse'
import { TabBar } from '@/components/docs/tab-bar'
import { SiteFooter } from '@/components/docs/site-footer'
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
          pb: '16',
          position: 'relative',
          // on the row wrapper this stops above main's bottom padding
          _before: {
            content: '""',
            display: 'none',
            position: 'absolute',
            top: 'calc(var(--navbar-height) + var(--banner-height) + var(--tabbar-height))',
            bottom: '0',
            insetInlineStart: '290px',
            width: '1px',
            bg: 'border',
            lg: { display: 'block' }
          }
        })}
      >
        {children}
      </main>
      <MobileBrowse />
      <SiteFooter />
    </div>
  )
}
