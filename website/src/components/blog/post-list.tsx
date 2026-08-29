'use client'

import { css } from '@/styled-system/css'
import { Box, Stack } from '@/styled-system/jsx'
import Link from 'next/link'
import { useState } from 'react'

export interface PostSummary {
  slug: string
  title: string
  description?: string
  date: string
  author?: string[]
  type?: 'article' | 'release'
}

const FILTERS = ['Everything', 'Articles', 'Releases'] as const
type Filter = (typeof FILTERS)[number]

function monthYear(iso: string) {
  return new Date(iso)
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    .toUpperCase()
}

const segmentStyles = css({
  textStyle: 'sm',
  fontWeight: 'medium',
  px: '4',
  py: '2',
  color: 'fg.muted',
  bg: 'transparent',
  cursor: 'pointer',
  transitionProperty: 'background-color, color',
  transitionDuration: '150ms',
  _hover: { color: 'fg' },
  '&[aria-selected=true]': { bg: 'bg.muted', color: 'fg' }
})

export function PostList({ posts }: { posts: PostSummary[] }) {
  const [filter, setFilter] = useState<Filter>('Everything')

  const visible = posts.filter(post =>
    filter === 'Everything'
      ? true
      : filter === 'Releases'
        ? post.type === 'release'
        : post.type !== 'release'
  )

  const years = [...new Set(visible.map(p => new Date(p.date).getFullYear()))]

  return (
    <Box mt="16">
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        gap="4"
        mb="10"
      >
        <Box
          role="tablist"
          aria-label="Filter posts"
          display="inline-flex"
          borderWidth="1px"
          borderColor="border"
          rounded="md"
          overflow="hidden"
        >
          {FILTERS.map(item => (
            <button
              key={item}
              role="tab"
              type="button"
              aria-selected={filter === item}
              onClick={() => setFilter(item)}
              className={segmentStyles}
            >
              {item}
            </button>
          ))}
        </Box>
        <Box textStyle="eyebrow" color="fg.subtle">
          {visible.length} {visible.length === 1 ? 'post' : 'posts'}
        </Box>
      </Box>

      {years.map(year => (
        <Box
          key={year}
          display="grid"
          gridTemplateColumns={{ base: '1fr', md: '8rem 1fr' }}
          gap={{ base: '4', md: '8' }}
          mb="10"
        >
          <Box
            fontSize="2xl"
            fontWeight="bold"
            letterSpacing="tight"
            color="fg"
          >
            {year}
          </Box>
          <Stack gap="0">
            {visible
              .filter(p => new Date(p.date).getFullYear() === year)
              .map(post => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className={css({
                    display: 'grid',
                    gridTemplateColumns: { base: '1fr', md: '9rem 1fr' },
                    gap: { base: '2', md: '6' },
                    py: '6',
                    borderTopWidth: '1px',
                    borderColor: 'border',
                    textDecoration: 'none',
                    color: 'fg',
                    transitionProperty: 'background-color',
                    transitionDuration: '150ms',
                    _hover: { bg: 'bg.subtle' }
                  })}
                >
                  <Box textStyle="eyebrow" color="fg.subtle" pt="1">
                    {monthYear(post.date)}
                  </Box>
                  <Stack gap="2">
                    <Box
                      display="flex"
                      alignItems="center"
                      gap="3"
                      flexWrap="wrap"
                    >
                      <Box textStyle="lg" fontWeight="semibold">
                        {post.title}
                      </Box>
                      {post.type === 'release' && (
                        <Box
                          textStyle="eyebrow"
                          color="fg.subtle"
                          borderWidth="1px"
                          borderColor="border"
                          px="2"
                          py="1"
                        >
                          Release
                        </Box>
                      )}
                    </Box>
                    {post.description && (
                      <Box textStyle="sm" color="fg.muted" lineHeight="1.6">
                        {post.description}
                      </Box>
                    )}
                    {post.author && post.author.length > 0 && (
                      <Box textStyle="sm" color="fg.subtle">
                        {post.author.join(', ')}
                      </Box>
                    )}
                  </Stack>
                </Link>
              ))}
          </Stack>
        </Box>
      ))}
    </Box>
  )
}
