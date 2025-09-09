import { docs } from '.velite'
import { Breadcrumb } from '@/components/docs/breadcrumb'
import { Header } from '@/components/docs/header'
import { MDXContent } from '@/components/docs/mdx-content'
import { MobileDocsNav } from '@/components/docs/mobile-docs-nav'
import { Sidebar } from '@/components/docs/sidebar'
import { Toc } from '@/components/ui/toc'
import { css } from '@/styled-system/css'
import { Box } from '@/styled-system/jsx'
import { notFound } from 'next/navigation'

interface DocsPageProps {
  params: {
    slug: string[]
  }
}

export async function generateStaticParams() {
  return docs.map(doc => ({ slug: doc.slug.split('/').slice(1) }))
}

export async function generateMetadata({ params }: DocsPageProps) {
  const doc = docs.find(doc => doc.slug.endsWith(params.slug.join('/')))
  return {
    title: doc ? `${doc.title} | Panda CSS` : 'Panda CSS',
    description: doc?.description
  }
}

export default function DocsPage(props: DocsPageProps) {
  const params = props.params

  const slug = params.slug.join('/')
  const doc = docs.find(doc => doc.slug.endsWith(slug))

  if (!doc) {
    notFound()
  }

  return (
    <>
      <Box maxW="90rem" mx="auto" display="flex" position="relative">
        {/* Sidebar */}
        <Box
          as="aside"
          display={{ base: 'none', lg: 'block' }}
          flexShrink="0"
          w="64"
          position="sticky"
          top="calc(var(--navbar-height) + var(--banner-height) + 1rem)"
          height="calc(100vh - var(--navbar-height) - var(--banner-height) - 1rem)"
        >
          <Box overflowY="auto" height="100%" className="scroll-area" p="4">
            <Sidebar slug={slug} />
          </Box>
        </Box>

        {/* Main Content */}
        <Box
          as="article"
          flex="1"
          minW="0"
          px={{ base: '4', lg: '10' }}
          pt="10"
        >
          <Breadcrumb slug={slug} />
          <Header doc={doc} />
          <div
            className={css({
              '& > *:first-child': { mt: 0 },
              '& > *:last-child': { mb: 0 }
            })}
          >
            <MDXContent code={doc.code} />
          </div>
        </Box>

        {/* Table of Contents */}
        <Box
          display={{ base: 'none', xl: 'block' }}
          flexShrink="0"
          w="56"
          position="sticky"
          top="calc(var(--navbar-height) + var(--banner-height))"
          pt="10"
          maxH="calc(100vh - var(--navbar-height) - var(--banner-height) - 1rem)"
        >
          <Box overflowY="auto" height="100%" className="scroll-area">
            <Toc data={doc.toc} />
          </Box>
        </Box>
      </Box>

      {/* Mobile Navigation */}
      <MobileDocsNav slug={slug} />
    </>
  )
}
