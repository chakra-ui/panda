import { pageSeo } from '@/lib/seo'
import { LuRss } from 'react-icons/lu'
import { AuthorLine } from '@/components/blog/author-line'
import { blogMdxComponents } from '@/components/blog/mdx-components'
import { MobileToc } from '@/components/docs/mobile-toc'
import { Toc } from '@/components/ui/toc'
import { blogSource, getMarkdown, getReadingTime } from '@/lib/source'
import { toTocEntries } from '@/lib/toc'
import { css, cx } from '@/styled-system/css'
import { prose } from '@/styled-system/recipes'
import { Box, Stack, panda } from '@/styled-system/jsx'
import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface BlogPostPageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return blogSource.getPages().map(page => ({ slug: page.slugs.join('/') }))
}

export async function generateMetadata({
  params
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params
  const page = blogSource.getPage([slug])

  if (!page) {
    return { title: 'Panda CSS Blog' }
  }

  const post = page.data

  return pageSeo({
    title: `${post.title} | Panda CSS Blog`,
    description: post.description,
    path: page.url,
    category: 'Blog',
    publishedTime: post.date
  })
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
  const page = blogSource.getPage([slug])

  if (!page) {
    notFound()
  }

  const post = page.data
  const { body: MDX } = post
  const toc = toTocEntries(post.toc)
  const readingTime = getReadingTime(await getMarkdown(page))

  return (
    <Box maxW="90rem" mx="auto" display="flex" position="relative" pb="24">
      {/* Main content */}
      <Box as="article" flex="1" minW="0" px={{ base: '4', lg: '10' }} pt="12">
        <Box maxW="3xl" mx="auto">
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
            <Box
              display="flex"
              alignItems="center"
              gap="3"
              flexWrap="wrap"
              justifyContent="space-between"
            >
              <Box display="flex" alignItems="center" gap="3" flexWrap="wrap">
                <panda.span textStyle="eyebrow" color="fg.subtle">
                  {formatDate(post.date)}
                </panda.span>
                <panda.span color="fg.subtle" aria-hidden>
                  ·
                </panda.span>
                <panda.span textStyle="eyebrow" color="fg.subtle">
                  {readingTime} min read
                </panda.span>
              </Box>

              <a
                href="/rss.xml"
                aria-label="Subscribe to the RSS feed"
                className={css({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2',
                  textStyle: 'eyebrow',
                  color: 'fg.subtle',
                  textDecoration: 'none',
                  transitionProperty: 'color',
                  transitionDuration: '150ms',
                  _hover: { color: 'fg' }
                })}
              >
                <LuRss size={14} aria-hidden />
                RSS
              </a>
            </Box>

            <Box pt="2">
              <AuthorLine authors={post.author} size="md" linked />
            </Box>
          </Stack>

          <div className={cx(prose({ size: 'lg' }), css({ maxW: 'none' }))}>
            <MDX components={blogMdxComponents} />
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
      </Box>

      {/* Table of contents */}
      <MobileToc data={toc} />

      {toc.length > 0 && (
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
            <Toc data={toc} />
          </Box>
        </Box>
      )}
    </Box>
  )
}
