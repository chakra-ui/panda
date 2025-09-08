import { ChevronRightIcon } from '@/icons'
import { css } from '@/styled-system/css'
import { HStack } from '@/styled-system/jsx'

interface DocsBreadcrumbProps {
  slug: string
}

export function DocsBreadcrumb({ slug }: DocsBreadcrumbProps) {
  const parts = slug.split('/')
  const breadcrumbs = parts.map((part, index) => ({
    label: part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' '),
    isLast: index === parts.length - 1
  }))

  return (
    <HStack mb="4" flexWrap="wrap" gap="2">
      {breadcrumbs.map((crumb, index) => (
        <HStack
          key={`${crumb.label}-${index}`}
          textStyle="sm"
          textTransform="capitalize"
        >
          {crumb.isLast ? (
            <span className={css({ color: 'fg', fontWeight: 'medium' })}>
              {crumb.label}
            </span>
          ) : (
            <span
              className={css({
                color: 'fg.muted',
                _hover: { color: 'fg' },
                transition: 'colors'
              })}
            >
              {crumb.label}
            </span>
          )}
          {!crumb.isLast && (
            <ChevronRightIcon className={css({ w: 3, h: 3 })} />
          )}
        </HStack>
      ))}
    </HStack>
  )
}
