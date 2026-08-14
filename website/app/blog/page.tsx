import { blog } from '.velite'
import { generateOgImageUrl } from '@/lib/og-image'
import { css } from '@/styled-system/css'
import { Box, Container, Stack, panda } from '@/styled-system/jsx'
import type { Metadata } from 'next'
import Link from 'next/link'

const ogTitle = 'Panda CSS Blog'
const ogDescription = 'News, updates, and deep dives from the Panda CSS team'

export const metadata: Metadata = {
  title: 'Blog',
  description: ogDescription,
  openGraph: {
    title: ogTitle,
    description: ogDescription,
    type: 'website',
    images: [generateOgImageUrl({ title: ogTitle, description: ogDescription, category: 'Blog' })]
  },
  twitter: {
    card: 'summary_large_image',
    title: ogTitle,
    description: ogDescription,
    images: [generateOgImageUrl({ title: ogTitle, description: ogDescription, category: 'Blog' })]
  }
}

function formatDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export default function BlogPage() {
  const posts = [...blog].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <Box bg="bg.muted" pt="20" minH="80dvh">
      <Container py="20">
        <Stack gap="6" align="center" mb="16">
          <panda.h1
            fontSize={{ base: '3xl', md: '5xl' }}
            fontWeight="bold"
            letterSpacing="tight"
          >
            Blog
          </panda.h1>
          <panda.p
            fontSize={{ base: 'lg', md: 'xl' }}
            color="fg.muted"
            maxW="2xl"
            textAlign="center"
          >
            {ogDescription}
          </panda.p>
        </Stack>

        <Box
          display="grid"
          gridTemplateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }}
          gap="8"
          maxW="7xl"
          mx="auto"
        >
          {posts.map(post => {
            const slug = post.slug.split('/').slice(1).join('/')
            return (
              <Link
                key={post.slug}
                href={`/blog/${slug}`}
                className={css({
                  display: 'block',
                  height: 'full',
                  p: '6',
                  bg: 'bg',
                  borderWidth: '1px',
                  borderRadius: 'lg',
                  transition: 'all 0.2s',
                  _hover: { shadow: 'md', transform: 'translateY(-2px)' }
                })}
              >
                <Stack gap="2">
                  <panda.p fontSize="sm" color="fg.subtle">
                    {formatDate(post.date)}
                    {post.author && (
                      <panda.span mx="2" aria-hidden>
                        ·
                      </panda.span>
                    )}
                    {post.author}
                  </panda.p>
                  <panda.h2 fontSize="xl" fontWeight="semibold" lineHeight="tight">
                    {post.title}
                  </panda.h2>
                  {post.description && (
                    <panda.p color="fg.muted" lineHeight="relaxed">
                      {post.description}
                    </panda.p>
                  )}
                  {post.tags && post.tags.length > 0 && (
                    <Box display="flex" gap="2" mt="1" flexWrap="wrap">
                      {post.tags.map(tag => (
                        <panda.span
                          key={tag}
                          fontSize="xs"
                          px="2"
                          py="0.5"
                          bg="bg.muted"
                          borderWidth="1px"
                          borderRadius="full"
                          color="fg.muted"
                        >
                          {tag}
                        </panda.span>
                      ))}
                    </Box>
                  )}
                </Stack>
              </Link>
            )
          })}
        </Box>
      </Container>
    </Box>
  )
}
