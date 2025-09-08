import { docs } from '.velite'
import { Toc } from '@/components/ui/toc'
import { DocsBreadcrumb } from '@/docs-layout/breadcrumb'
import { DocsHeader } from '@/docs-layout/header'
import { MDXContent } from '@/docs-layout/mdx-content'
import { MobileDocsNav } from '@/docs-layout/mobile-docs-nav'
import { DocsSidebar } from '@/docs-layout/sidebar'
import { css } from '@/styled-system/css'
import { Box, Container, Flex } from '@/styled-system/jsx'
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
      <Container maxW="8xl" py="8">
        <Flex gap="8">
          {/* Sidebar */}
          <Box
            display={{ base: 'none', lg: 'block' }}
            flexShrink="0"
            w="64"
            position="sticky"
            top="20"
            maxH="calc(100vh - 5rem)"
            overflowY="auto"
          >
            <DocsSidebar currentSlug={slug} />
          </Box>

          {/* Main Content */}
          <Box flex="1" minW="0">
            <DocsBreadcrumb slug={slug} />
            <DocsHeader doc={doc} />
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
            top="20"
            maxH="calc(100vh - 5rem)"
          >
            <Toc data={doc.toc} />
          </Box>
        </Flex>
      </Container>

      {/* Mobile Navigation */}
      <MobileDocsNav currentSlug={slug} />
    </>
  )
}
