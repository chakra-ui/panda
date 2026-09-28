import { docsTabs } from '@/docs.config'
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

const allPages: PaginationItem[] = docsTabs.flatMap(tab =>
  tab.items.flatMap(group =>
    (group.items || []).flatMap(item => {
      if (item.external) return []
      const url = item.url ? `${tab.key}/${item.url}` : item.href
      return url ? [{ title: item.title, url, category: group.title }] : []
    })
  )
)

function getPagination(currentSlug: string): {
  prev?: PaginationItem
  next?: PaginationItem
} {
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
