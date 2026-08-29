import { docsTabs } from '@/docs.config'
import { ChevronRightIcon } from '@/icons'
import { css } from '@/styled-system/css'
import { HStack } from '@/styled-system/jsx'
import Link from 'next/link'

interface Props {
  slug: string
}

const crumbStyles = css({
  color: 'fg.subtle',
  textDecoration: 'none',
  transitionProperty: 'color',
  transitionDuration: '150ms',
  _hover: { color: 'fg' }
})

export const Breadcrumb = ({ slug }: Props) => {
  const [tabKey, pageUrl] = slug.split('/')
  const tab = docsTabs.find(item => item.key === tabKey)

  if (!tab) return null

  const group = tab.items.find(item =>
    item.items?.some(page => page.url === pageUrl)
  )

  const trail = [
    { label: tab.title, href: `/docs/${tab.key}/overview` },
    group ? { label: group.title } : undefined
  ].filter(Boolean) as { label: string; href?: string }[]

  return (
    <HStack mb="4" flexWrap="wrap" gap="2" textStyle="eyebrow">
      {trail.map((crumb, index) => {
        const isLast = index === trail.length - 1
        return (
          <HStack key={crumb.label} gap="2">
            {crumb.href && !isLast ? (
              <Link href={crumb.href} className={crumbStyles}>
                {crumb.label}
              </Link>
            ) : (
              <span className={css({ color: isLast ? 'fg' : 'fg.subtle' })}>
                {crumb.label}
              </span>
            )}
            {!isLast && <ChevronRightIcon className={css({ w: 3, h: 3 })} />}
          </HStack>
        )
      })}
    </HStack>
  )
}
