import { DocsNavbar } from '@/components/docs/docs-navbar'
import { MobileBrowse } from '@/components/docs/mobile-browse'
import { DocsFooter } from '@/components/docs/docs-footer'
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
        '--banner-height': { base: '3.5rem', md: '2.5rem' }
      })}
    >
      <SkipNavLink styled />
      <DocsNavbar />
      <main
        className={css({
          pt: 'calc(var(--navbar-height) + var(--banner-height))',
          position: 'relative',
          _before: {
            content: '""',
            display: 'none',
            position: 'absolute',
            top: 'calc(var(--navbar-height) + var(--banner-height))',
            bottom: '0',
            insetInlineStart: '290px',
            width: '1px',
            bg: 'border',
            lg: { display: 'block' }
          }
        })}
      >
        <SkipNavContent />
        {children}
      </main>
      <MobileBrowse />
      <DocsFooter />
    </div>
  )
}
