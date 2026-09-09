import { DocsNavbar } from '@/components/docs/docs-navbar'
import { SiteFooter } from '@/components/docs/site-footer'
import { css } from '@/styled-system/css'

export default function BlogLayout(props: React.PropsWithChildren) {
  const { children } = props
  return (
    <div
      className={css({
        '--navbar-height': '4rem',
        '--banner-height': '2.5rem'
      })}
    >
      <DocsNavbar />
      <main
        className={css({
          pt: 'calc(var(--navbar-height) + var(--banner-height))'
        })}
      >
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}
