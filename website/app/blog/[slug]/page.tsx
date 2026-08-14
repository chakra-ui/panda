import { blog } from '.velite'
import { MDXContent } from '@/components/docs/mdx-content'
import { Toc } from '@/components/ui/toc'
import { generateOgImageUrl } from '@/lib/og-image'
import { css } from '@/styled-system/css'
import { Box, Stack, panda } from '@/styled-system/jsx'
import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface BlogPostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return blog.map(post => ({ slug: post.slug.split('/').slice(1).join('/') }))
}

export async function generateMetadata({
  params
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = blog.find(p => p.slug === `blog/${slug}`)

  if (!post) {
    return { title: 'Panda CSS Blog' }
  }

  const ogImage = generateOgImageUrl({
    title: post.title,
    description: post.description,
    category: 'Blog'
  })

  return {
    title: `${post.title} | Panda CSS Blog`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      images: [ogImage]
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [ogImage]
    }
  }
}

function formatDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export default async function BlogPostPage(props: BlogPostPageProps) {
  const { slug } = await props.params
  const post = blog.find(p => p.slug === `blog/${slug}`)

  if (!post) {
    notFound()
  }

  return (
    <Box
      maxW="90rem"
      mx="auto"
      display="flex"
      position="relative"
      pt="calc(var(--navbar-height, 4rem) + 2rem)"
      pb="32"
    >
      {/* Main content */}
      <Box as="article" flex="1" minW="0" px={{ base: '4', lg: '10' }} pt="10">
        <Link
          href="/blog"
          className={css({
            display: 'inline-flex',
            alignItems: 'center',
            gap: '1',
            fontSize: 'sm',
            color: 'fg.muted',
            mb: '8',
            _hover: { color: 'fg' }
          })}
        >
          ← All posts
        </Link>

        <Stack gap="4" mb="12">
          <panda.h1
            fontSize={{ base: '3xl', md: '4xl' }}
            fontWeight="bold"
            lineHeight="tight"
          >
            {post.title}
          </panda.h1>
          {post.description && (
            <panda.p fontSize="lg" color="fg.muted" maxW="3xl">
              {post.description}
            </panda.p>
          )}
          <Box display="flex" alignItems="center" gap="2" flexWrap="wrap">
            <panda.span fontSize="sm" color="fg.subtle">
              {formatDate(post.date)}
            </panda.span>
            {post.author && (
              <>
                <panda.span color="fg.subtle" aria-hidden>
                  ·
                </panda.span>
                <panda.span fontSize="sm" color="fg.subtle">
                  {post.author}
                </panda.span>
              </>
            )}
          </Box>
        </Stack>

        <div
          className={css({
            '& > *:first-child': { mt: 0 },
            '& > *:last-child': { mb: 0 }
          })}
        >
          <MDXContent code={post.code} />
          {post.tags && post.tags.length > 0 && (
            <Box display="flex" gap="2" flexWrap="wrap" mt="10">
              {post.tags.map(tag => (
                <panda.span
                  key={tag}
                  fontSize="sm"
                  px="2"
                  py="0.5"
                  bg="bg.muted"
                  borderWidth="1px"
                  borderRadius="md"
                  color="fg.muted"
                >
                  #{tag}
                </panda.span>
              ))}
            </Box>
          )}
        </div>
      </Box>

      {/* Table of contents */}
      {post.toc.length > 0 && (
        <Box
          display={{ base: 'none', xl: 'block' }}
          flexShrink="0"
          w="56"
          position="sticky"
          top="calc(var(--navbar-height, 4rem) + 2rem)"
          pt="10"
          maxH="calc(100vh - var(--navbar-height, 4rem) - 2rem)"
        >
          <Box overflowY="auto" height="100%" className="scroll-area">
            <Toc data={post.toc as any} />
          </Box>
        </Box>
      )}
    </Box>
  )
}
