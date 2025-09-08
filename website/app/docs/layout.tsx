import { DocsFooter } from '@/mdx/footer'
import { DocsNavbar } from '@/mdx/navbar'
import { css } from '@/styled-system/css'

export default function DocsLayout(props: React.PropsWithChildren) {
  const { children } = props
  return (
    <>
      <DocsNavbar />
      <main
        className={css({
          minH: 'calc(100vh - 64px)',
          pt: { base: '4', md: '8' },
          pb: { base: '8', md: '16' }
        })}
      >
        {children}
      </main>
      <DocsFooter />
    </>
  )
}
