import { docsTabs, type NavItem } from '@/docs.config'
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

// Scoped to one tab so prev/next never crosses a tab boundary.
function flattenTab(tabKey: string, groups: NavItem[]): PaginationItem[] {
  const result: PaginationItem[] = []

  for (const group of groups) {
    for (const item of group.items || []) {
      if (item.external) continue
      const url = item.url ? `${tabKey}/${item.url}` : item.href
      if (!url) continue
      result.push({ title: item.title, url, category: group.title })
    }
  }

  return result
}

function getPagination(currentSlug: string): {
  prev?: PaginationItem
  next?: PaginationItem
} {
  const tabKey = currentSlug.split('/')[0]
  const tab = docsTabs.find(t => t.key === tabKey)

  if (!tab) {
    return {}
  }

  const allPages = flattenTab(tabKey, tab.items)

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

  return (
    <HStack
      justify="space-between"
      mt="20"
      pt="10"
      borderTopWidth="1px"
      borderColor="border"
      gap="4"
    >
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
      href={item.url.startsWith('/') ? item.url : `/docs/${item.url}`}
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
