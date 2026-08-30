import { docs } from '.velite'
import { Breadcrumb } from '@/components/docs/breadcrumb'
import { Header } from '@/components/docs/header'
import { MDXContent } from '@/components/docs/mdx-content'
import { PageActions } from '@/components/docs/page-actions'
import { MobileToc } from '@/components/docs/mobile-toc'
import { Pagination } from '@/components/docs/pagination'
import { Sidebar } from '@/components/docs/sidebar'
import { Toc } from '@/components/ui/toc'
import { generateOgImageUrl } from '@/lib/og-image'
import { css } from '@/styled-system/css'
import { Box } from '@/styled-system/jsx'
import { notFound } from 'next/navigation'

interface DocsPageProps {
  params: Promise<{
    slug: string[]
  }>
}

export async function generateStaticParams() {
  return docs.map(doc => ({ slug: doc.slug.split('/').slice(1) }))
}

export async function generateMetadata({ params }: DocsPageProps) {
  const { slug } = await params
  const doc = docs.find(doc => doc.slug === `docs/${slug.join('/')}`)
  
  if (!doc) {
    return {
      title: 'Panda CSS',
      description: 'Build modern websites using build time and type-safe CSS-in-JS'
    }
  }

  const ogImage = generateOgImageUrl({
    title: doc.title,
    description: doc.description,
    category: 'Docs'
  })

  return {
    title: `${doc.title} | Panda CSS`,
    description: doc.description,
    openGraph: {
      title: doc.title,
      description: doc.description,
      type: 'article',
      images: [ogImage]
    },
    twitter: {
      card: 'summary_large_image',
      title: doc.title,
      description: doc.description,
      images: [ogImage]
    }
  }
}

export default async function DocsPage(props: DocsPageProps) {
  const params = await props.params

  const slug = params.slug.join('/')
  const doc = docs.find(doc => doc.slug === `docs/${slug}`)

  if (!doc) {
    notFound()
  }

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
          <Box overflowY="auto" height="100%" className="scroll-area" py="4" px="6">
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
          <Header doc={doc} />
          <div
            className={css({
              '& > *:first-child': { mt: '0' },
              '& > *:last-child': { mb: '0' }
            })}
          >
            <MDXContent code={doc.code} />
          </div>
          <Pagination slug={slug} />
          <PageActions slug={slug} />
        </Box>

        {/* Table of Contents */}
        {!doc.hideToc && (
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
          <Box overflowY="auto" height="100%" className="scroll-area">
            <Toc data={doc.toc} />
          </Box>
        </Box>
        )}
      </Box>

      {!doc.hideToc && <MobileToc data={doc.toc} />}
    </>
  )
}
