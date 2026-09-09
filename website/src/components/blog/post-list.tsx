'use client'

import { AuthorLine } from '@/components/blog/author-line'
import { PostFilter } from '@/components/blog/post-filter'
import { css } from '@/styled-system/css'
import { Box, Stack } from '@/styled-system/jsx'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

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

/** `?type=articles` or `?type=releases`; anything else is everything. */
const FILTER_PARAM: Partial<Record<Filter, string>> = {
  Articles: 'articles',
  Releases: 'releases'
}

function filterFromParam(value: string | null): Filter {
  return FILTERS.find(item => FILTER_PARAM[item] === value) ?? 'Everything'
}

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
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const filter = filterFromParam(searchParams.get('type'))

  const setFilter = (next: Filter) => {
    const params = new URLSearchParams(searchParams)
    const value = FILTER_PARAM[next]
    if (value) params.set('type', value)
    else params.delete('type')
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

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
        <PostFilter<Filter>
          label="Filter posts"
          options={FILTERS}
          value={filter}
          onChange={setFilter}
        />
        <Box textStyle="eyebrow" color="fg.subtle">
          {visible.length} {visible.length === 1 ? 'post' : 'posts'}
        </Box>
      </Box>

      {years.map(year => (
        <Box key={year} mb="14">
          <Box
            as="h2"
            fontSize="md"
            fontWeight="semibold"
            color="fg.subtle"
            position="sticky"
            top="calc(var(--navbar-height) + var(--banner-height))"
            bg="bg"
            py="3"
            borderBottomWidth="1px"
            borderColor="border"
            zIndex="1"
          >
            {year}
          </Box>
          <Stack gap="0" mt="2" mx="-4" rounded="lg" overflow="hidden">
            {visible
              .filter(p => new Date(p.date).getFullYear() === year)
              .map(post => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className={css({
                    display: 'block',
                    py: '8',
                    px: '4',
                    textDecoration: 'none',
                    color: 'fg',
                    transitionProperty: 'background-color',
                    transitionDuration: '150ms',
                    _hover: { bg: 'bg.subtle' },
                    // One hairline between rows, none above the first.
                    '& + &': {
                      borderTopWidth: '1px',
                      borderColor: 'border'
                    }
                  })}
                >
                  <Stack gap="3">
                    <Box
                      display="flex"
                      alignItems="center"
                      gap="2"
                      flexWrap="wrap"
                      textStyle="eyebrow"
                      color="fg.subtle"
                    >
                      <span>{monthYear(post.date)}</span>
                      {post.type === 'release' && (
                        <Box
                          bg="bg.muted"
                          color="fg"
                          rounded="sm"
                          px="1.5"
                          py="0.5"
                          lineHeight="1"
                        >
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
