'use client'

import { AuthorLine } from '@/components/blog/author-line'
import { Segmented } from '@/components/ui/segmented'
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
  readingTime?: number
  type?: 'article' | 'release'
}

const FILTERS = ['Everything', 'Articles', 'Releases'] as const
type Filter = (typeof FILTERS)[number]

function monthYear(iso: string) {
  return new Date(iso)
    .toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
    .toUpperCase()
}

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
        <Segmented
          label="Filter posts"
          size="sm"
          value={filter}
          onValueChange={value => setFilter(value as Filter)}
          options={FILTERS.map(item => ({ value: item, label: item }))}
        />
        <Box textStyle="eyebrow" color="fg.subtle">
          {visible.length} {visible.length === 1 ? 'post' : 'posts'}
        </Box>
      </Box>

      {years.map(year => (
        <Box key={year} mb="12">
          <Box
            display="flex"
            alignItems="center"
            gap="4"
            mb="2"
            position="sticky"
            top="calc(var(--navbar-height) + var(--banner-height))"
            bg="bg"
            py="3"
            zIndex="1"
          >
            <Box textStyle="eyebrow" color="fg" bg="accent.wash" px="2" py="1">
              {year}
            </Box>
            <Box flex="1" h="1px" bg="border" />
          </Box>
          <Stack gap="0">
            {visible
              .filter(p => new Date(p.date).getFullYear() === year)
              .map(post => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className={css({
                    display: 'block',
                    position: 'relative',
                    py: '6',
                    ps: '5',
                    borderTopWidth: '1px',
                    borderColor: 'border',
                    textDecoration: 'none',
                    color: 'fg',
                    transitionProperty: 'background-color',
                    transitionDuration: '150ms',
                    _before: {
                      content: '""',
                      position: 'absolute',
                      insetY: '0',
                      insetStart: '0',
                      width: '2px',
                      bg: 'transparent',
                      transitionProperty: 'background-color',
                      transitionDuration: '150ms'
                    },
                    _hover: {
                      bg: 'bg.subtle',
                      _before: { bg: 'accent.emphasis' }
                    }
                  })}
                >
                  <Stack gap="3">
                    <Box
                      display="flex"
                      alignItems="center"
                      gap="3"
                      flexWrap="wrap"
                      textStyle="eyebrow"
                      color="fg.subtle"
                    >
                      <span>{monthYear(post.date)}</span>
                      {post.type === 'release' && (
                        <Box color="fg" bg="accent.wash" px="2" py="1">
                          Release
                        </Box>
                      )}
                    </Box>

                    <Box textStyle="xl" fontWeight="semibold" lineHeight="1.3">
                      {post.title}
                    </Box>

                    {post.description && (
                      <Box textStyle="sm" color="fg.muted" lineHeight="1.6">
                        {post.description}
                      </Box>
                    )}

                    <AuthorLine
                      authors={post.author}
                      readingTime={post.readingTime}
                    />
                  </Stack>
                </Link>
              ))}
          </Stack>
        </Box>
      ))}
    </Box>
  )
}
