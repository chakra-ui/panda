import { Footer } from '@/mdx/footer'
import { Navbar } from '@/mdx/navbar'
import { css } from '@/styled-system/css'

export default function DocsLayout(props: React.PropsWithChildren) {
  const { children } = props
  return (
    <div id="__next">
      <Navbar />
      <main
        className={css({
          '--navbar-height': '4rem',
          '--menu-height': '3.75rem',
          '--banner-height': '2.5rem',
          pt: 'calc(var(--navbar-height) + var(--banner-height))',
          pb: '32'
        })}
      >
        {children}
      </main>
      <Footer />
    </div>
  )
}
