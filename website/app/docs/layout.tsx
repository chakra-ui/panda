import { DocsNavbar } from '@/components/docs/docs-navbar'
import { TabBar } from '@/components/docs/tab-bar'
import { Footer } from '@/mdx/footer'
import { css } from '@/styled-system/css'

export default function DocsLayout(props: React.PropsWithChildren) {
  const { children } = props
  return (
    <div
      id="__next"
      className={css({
        '--navbar-height': '4rem',
        '--menu-height': '3.75rem',
        '--banner-height': '2.5rem',
        '--tabbar-height': '2.75rem'
      })}
    >
      <DocsNavbar />
      <div
        className={css({
          position: 'sticky',
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
          pb: '32'
        })}
      >
        {children}
      </main>
      <Footer />
    </div>
  )
}
