import { pageSeo } from '@/lib/seo'
import { blogSource, getMarkdown, getReadingTime } from '@/lib/source'
import { AuthorLine } from '@/components/blog/author-line'
import { PostList } from '@/components/blog/post-list'
import { css } from '@/styled-system/css'
import { Box, Stack } from '@/styled-system/jsx'
import type { Metadata } from 'next'
import Link from 'next/link'
import { LuArrowRight, LuRss } from 'react-icons/lu'

const ogTitle = 'Panda CSS Blog'
const ogDescription = 'News, updates, and deep dives from the Panda CSS team'

export const metadata: Metadata = pageSeo({
  title: ogTitle,
  description: ogDescription,
  path: '/blog',
  category: 'Blog'
})

export default async function BlogPage() {
  const posts = await Promise.all(
    blogSource
      .getPages()
      .sort(
        (a, b) =>
          new Date(b.data.date).getTime() - new Date(a.data.date).getTime()
      )
      .map(async page => ({
        ...page.data,
        slug: page.slugs.join('/'),
        readingTime: getReadingTime(await getMarkdown(page))
      }))
  )

  const [featured] = posts

  return (
    <Box maxW="72rem" mx="auto" px="6" pt="16" pb="24">
      <Box
        display="flex"
        alignItems="flex-end"
        justifyContent="space-between"
        mb="12"
      >
        <Box
          as="h1"
          fontSize={{ base: '5xl', md: '6xl' }}
          fontWeight="bold"
          letterSpacing="tighter"
          lineHeight="1"
        >
          Blog
        </Box>
        <a
          href="/rss.xml"
          className={css({
            display: 'flex',
            alignItems: 'center',
            gap: '2',
            textStyle: 'eyebrow',
            color: 'fg.subtle',
            textDecoration: 'none',
            _hover: { color: 'fg' }
          })}
        >
          <LuRss />
          RSS
        </a>
      </Box>

      <Link
        href={`/blog/${featured.slug}`}
        className={css({
          display: 'block',
          p: { base: '6', md: '10' },
          borderWidth: '1px',
          borderColor: 'border',
          rounded: 'lg',
          textDecoration: 'none',
          color: 'fg',
          transitionProperty: 'border-color, background-color',
          transitionDuration: '150ms',
          _hover: { borderColor: 'fg.subtle', bg: 'bg.subtle' }
        })}
      >
        <Box display="flex" alignItems="center" gap="3" mb="5" flexWrap="wrap">
          <Box textStyle="eyebrow" bg="accent" color="black" px="2" py="1">
            Latest
          </Box>
          <Box textStyle="eyebrow" color="fg.subtle">
            {new Date(featured.date)
              .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              .toUpperCase()}
            {featured.type === 'release' ? ' · RELEASE' : ''}
          </Box>
        </Box>

        <Box
          display="flex"
          alignItems="flex-end"
          justifyContent="space-between"
          gap="6"
        >
          <Stack gap="4" maxW="40rem">
            <Box
              as="h2"
              fontSize={{ base: '3xl', md: '4xl' }}
              fontWeight="bold"
              letterSpacing="tight"
              lineHeight="1.1"
            >
              {featured.title}
            </Box>
            {featured.description && (
              <Box textStyle="prose" color="fg.muted">
                {featured.description}
              </Box>
            )}
            <AuthorLine
              authors={featured.author}
              readingTime={featured.readingTime}
              size="md"
            />
          </Stack>
          <Box
            display={{ base: 'none', md: 'flex' }}
            alignItems="center"
            justifyContent="center"
            flexShrink="0"
            w="12"
            h="12"
            borderWidth="1px"
            borderColor="border"
            rounded="md"
          >
            <LuArrowRight />
          </Box>
        </Box>
      </Link>

      <PostList
        posts={posts.map(post => ({
          slug: post.slug,
          title: post.title,
          description: post.description,
          date: post.date,
          author: post.author,
          readingTime: post.readingTime,
          type: post.type
        }))}
      />
    </Box>
  )
}
