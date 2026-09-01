import { pageSeo } from '@/lib/seo'
import { Breadcrumb } from '@/components/docs/breadcrumb'
import { Header } from '@/components/docs/header'
import { mdxComponents } from '@/components/docs/mdx-components'
import { MobileToc } from '@/components/docs/mobile-toc'
import { PageActions } from '@/components/docs/page-actions'
import { Pagination } from '@/components/docs/pagination'
import { Sidebar } from '@/components/docs/sidebar'
import { Toc } from '@/components/ui/toc'
import { docsSource } from '@/lib/source'
import { toTocEntries } from '@/lib/toc'
import { css, cx } from '@/styled-system/css'
import { Box } from '@/styled-system/jsx'
import { notFound } from 'next/navigation'

interface DocsPageProps {
  params: Promise<{
    slug: string[]
  }>
}

export function generateStaticParams() {
  return docsSource.generateParams()
}

export async function generateMetadata({ params }: DocsPageProps) {
  const { slug } = await params
  const page = docsSource.getPage(slug)

  if (!page) {
    return {
      title: 'Panda CSS',
      description:
        'Build modern websites using build time and type-safe CSS-in-JS'
    }
  }

  return pageSeo({
    title: page.data.title,
    description: page.data.description,
    path: page.url,
    category: 'Docs'
  })
}

const sidebarScroll = css({
  maskImage:
    'linear-gradient(to bottom, black calc(100% - 2.5rem), transparent 100%)'
})

export default async function DocsPage(props: DocsPageProps) {
  const params = await props.params

  const slug = params.slug.join('/')
  const page = docsSource.getPage(params.slug)

  if (!page) {
    notFound()
  }

  const { body: MDX, hideToc } = page.data
  const toc = toTocEntries(page.data.toc)

  return (
    <>
      <Box display="flex" position="relative">
        {/* Sidebar */}
        <Box
          as="aside"
          display={{ base: 'none', lg: 'block' }}
          flexShrink="0"
          w="290px"
          position="sticky"
          top="calc(var(--navbar-height) + var(--banner-height) + var(--tabbar-height))"
          height="calc(100vh - var(--navbar-height) - var(--banner-height) - var(--tabbar-height))"
        >
          <Box
            overflowY="auto"
            height="100%"
            className={cx('scroll-area', sidebarScroll)}
            pt="10"
            pb="4"
            px="6"
          >
            <Sidebar slug={slug} />
          </Box>
        </Box>

        {/* Main Content */}
        <Box
          as="article"
          flex="1"
          minW="0"
          maxW="52rem"
          mx="auto"
          px="6"
          pt="10"
          pb="16"
        >
          <Breadcrumb slug={slug} />
          <Header page={page} />
          <div
            className={css({
              '& > *:first-child': { mt: '0' },
              '& > *:last-child': { mb: '0' }
            })}
          >
            <MDX components={mdxComponents} />
          </div>
          <Pagination slug={slug} />
          <PageActions slug={slug} />
        </Box>

        {/* Table of Contents — space is reserved even when hidden, so the
            article's `mx="auto"` centers against the same remaining width
            on every page, with or without a TOC. */}
        <Box
          display={{ base: 'none', xl: 'block' }}
          flexShrink="0"
          w="72"
          position="sticky"
          top="calc(var(--navbar-height) + var(--banner-height) + var(--tabbar-height))"
          pt="10"
          pr="6"
          maxH="calc(100vh - var(--navbar-height) - var(--banner-height) - var(--tabbar-height) - 1rem)"
        >
          {!hideToc && (
            <Box overflowY="auto" height="100%" className="scroll-area">
              <Toc data={toc} />
            </Box>
          )}
        </Box>
      </Box>

      {!hideToc && <MobileToc data={toc} />}
    </>
  )
}
