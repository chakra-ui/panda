import { docsNavigation, type NavItem } from '@/docs.config'
import { ChevronRightIcon } from '@/icons'
import { css } from '@/styled-system/css'
import { Box, HStack } from '@/styled-system/jsx'
import Link from 'next/link'

interface PaginationItem {
  title: string
  url: string
  category: string
}

interface Props {
  slug: string
}

// Flatten navigation to get all pages in order
function flattenNavigation(
  items: NavItem[],
  prefix = '',
  category = ''
): PaginationItem[] {
  const result: PaginationItem[] = []

  for (const item of items) {
    // Skip external links
    if (item.external) continue

    // Determine the current category
    const currentCategory = category || item.title

    // If item has a URL and no children, add it as a page
    if (item.url && !item.items) {
      const url = prefix ? `${prefix}/${item.url}` : item.url
      result.push({ title: item.title, url, category: currentCategory })
    }

    // Recursively process child items
    if (item.items) {
      const currentPrefix = item.url
        ? prefix
          ? `${prefix}/${item.url}`
          : item.url
        : prefix
      // Pass the category down - if this is a top-level section, use its title as category
      const categoryToPass = !prefix && item.url ? item.title : currentCategory
      result.push(
        ...flattenNavigation(item.items, currentPrefix, categoryToPass)
      )
    }
  }

  return result
}

function getPagination(currentSlug: string): {
  prev?: PaginationItem
  next?: PaginationItem
} {
  const allPages = flattenNavigation(docsNavigation.items || [])

  // Find exact match - the slug should match the page URL exactly
  const currentIndex = allPages.findIndex(page => {
    return page.url === currentSlug
  })

  if (currentIndex === -1) {
    return {}
  }

  return {
    prev: currentIndex > 0 ? allPages[currentIndex - 1] : undefined,
    next:
      currentIndex < allPages.length - 1
        ? allPages[currentIndex + 1]
        : undefined
  }
}

export const Pagination = ({ slug }: Props) => {
  const { prev, next } = getPagination(slug)

  if (!prev && !next) {
    return null
  }

  console.log(prev, next)

  return (
    <HStack justify="space-between" mt="12" gap="4">
      {prev ? <PagationLink item={prev} type="prev" /> : <Box flex="1" />}
      {next ? <PagationLink item={next} type="next" /> : <Box flex="1" />}
    </HStack>
  )
}

interface PagationLinkProps {
  item: PaginationItem
  type: 'prev' | 'next'
}

const PagationLink = (props: PagationLinkProps) => {
  const { item, type } = props
  return (
    <Link
      href={`/docs/${item.url}`}
      className={css({
        flex: '1',
        display: 'flex',
        alignItems: 'center',
        gap: '3',
        p: '4',
        rounded: 'lg',
        borderWidth: '1px',
        cursor: 'pointer',
        color: 'fg.muted',
        _icon: { boxSize: '4', flexShrink: '0' }
      })}
    >
      {type === 'prev' && (
        <ChevronRightIcon className={css({ transform: 'rotate(180deg)' })} />
      )}
      <Box textAlign="start" minW="0" flex="1">
        <Box className={css({ textStyle: 'sm', mb: '1' })}>{item.category}</Box>
        <Box
          className={css({ fontWeight: 'medium', color: 'fg', truncate: true })}
        >
          {item.title}
        </Box>
      </Box>
      {type === 'next' && <ChevronRightIcon />}
    </Link>
  )
}
