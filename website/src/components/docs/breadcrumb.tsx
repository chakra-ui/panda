import { ChevronRightIcon } from '@/icons'
import { css } from '@/styled-system/css'
import { HStack } from '@/styled-system/jsx'

interface Props {
  slug: string
}

export const Breadcrumb = ({ slug }: Props) => {
  const parts = slug.split('/')

  const breadcrumbs = parts.map((part, index) => ({
    label: part.replace(/-/g, ' '),
    isLast: index === parts.length - 1
  }))

  return (
    <HStack mb="4" flexWrap="wrap" gap="2">
      {breadcrumbs.map((crumb, index) => (
        <HStack
          key={`${crumb.label}-${index}`}
          textStyle="sm"
          fontWeight="semibold"
          textTransform="uppercase"
          letterSpacing="wide"
        >
          {crumb.isLast ? (
            <span className={css({ color: 'fg' })}>{crumb.label}</span>
          ) : (
            <span className={css({ color: 'fg.muted' })}>{crumb.label}</span>
          )}
          {!crumb.isLast && (
            <ChevronRightIcon className={css({ w: 3, h: 3 })} />
          )}
        </HStack>
      ))}
    </HStack>
  )
}
