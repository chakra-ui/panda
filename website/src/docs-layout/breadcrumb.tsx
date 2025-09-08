import Link from 'next/link'
import { css } from '@/styled-system/css'
import { Flex } from '@/styled-system/jsx'
import { ChevronRightIcon } from '@/icons'

interface DocsBreadcrumbProps {
  slug: string
}

export function DocsBreadcrumb({ slug }: DocsBreadcrumbProps) {
  const parts = slug.split('/')
  const breadcrumbs = parts.map((part, index) => ({
    label: part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' '),
    href: `/docs/${parts.slice(0, index + 1).join('/')}`,
    isLast: index === parts.length - 1
  }))

  return (
    <Flex
      align="center"
      gap="2"
      mb="4"
      fontSize="sm"
      color="fg.muted"
      flexWrap="wrap"
    >
      <Link
        href="/docs"
        className={css({
          _hover: { color: 'fg.default' },
          transition: 'colors'
        })}
      >
        Docs
      </Link>

      {breadcrumbs.map((crumb, index) => (
        <Flex key={crumb.href} align="center" gap="2">
          <ChevronRightIcon className={css({ w: 3, h: 3 })} />
          {crumb.isLast ? (
            <span
              className={css({ color: 'fg.default', fontWeight: 'medium' })}
            >
              {crumb.label}
            </span>
          ) : (
            <Link
              href={crumb.href}
              className={css({
                _hover: { color: 'fg.default' },
                transition: 'colors'
              })}
            >
              {crumb.label}
            </Link>
          )}
        </Flex>
      ))}
    </Flex>
  )
}
