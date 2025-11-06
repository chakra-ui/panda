'use client'

import { Badge } from '@/components/ui/badge'
import { docsNavigation, type NavItem } from '@/docs.config'
import { ChevronDownIcon, ChevronRightIcon } from '@/icons'
import { css } from '@/styled-system/css'
import { Box, Stack } from '@/styled-system/jsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { LuArrowUpRight } from 'react-icons/lu'

interface SidebarItem {
  title: string
  slug: string
  external?: boolean
  href?: string
  tag?: string
  children?: SidebarItem[]
}

interface Props {
  slug?: string
}

export function Sidebar({ slug: currentSlug }: Props) {
  const pathname = usePathname()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  )

  // Use the sidebar structure from config
  const sidebarStructure: SidebarItem[] =
    docsNavigation.items?.map((section: NavItem) => ({
      title: section.title,
      slug: section.url || '',
      children: section.items?.map((item: NavItem) => ({
        title: item.title,
        slug: item.external ? item.href || '' : `${section.url}/${item.url}`,
        external: item.external,
        href: item.href,
        tag: item.tag
      }))
    })) || []

  const toggleSection = (slug: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(slug)) {
        next.delete(slug)
      } else {
        next.add(slug)
      }
      return next
    })
  }

  const isActive = (slug: string) => {
    return pathname === `/docs/${slug}` || currentSlug === slug
  }

  const isSectionActive = (section: SidebarItem) => {
    return section.children?.some(child => isActive(child.slug)) || false
  }

  return (
    <Stack as="nav" gap="1">
      {sidebarStructure.map(section => {
        const isExpanded =
          expandedSections.has(section.slug) || isSectionActive(section)

        return (
          <div key={section.slug}>
            <button
              onClick={() => toggleSection(section.slug)}
              className={css({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                w: 'full',
                px: 3,
                py: 2,
                rounded: 'md',
                fontWeight: 'semibold',
                fontSize: 'sm',
                color: 'fg',
                transitionProperty: 'background',
                transitionDuration: '200ms',
                _hover: {
                  bg: 'bg.subtle'
                },
                cursor: 'pointer'
              })}
            >
              <span>{section.title}</span>
              {section.children && (
                <Box
                  as={isExpanded ? ChevronDownIcon : ChevronRightIcon}
                  w="4"
                  h="4"
                  color="fg.muted"
                />
              )}
            </button>

            {isExpanded && section.children && (
              <Stack gap="0.5" mt="1">
                {section.children.map(item => {
                  const linkStyles = css({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2',
                    px: '4',
                    py: '1.5',
                    rounded: 'md',
                    textStyle: 'sm',
                    color: 'fg.muted',
                    bg: 'transparent',
                    fontWeight: 'normal',
                    transitionProperty: 'background, color',
                    transitionDuration: '200ms',
                    _current: {
                      color: 'fg',
                      bg: 'accent.subtle',
                      fontWeight: 'semibold'
                    }
                  })

                  if (item.external) {
                    return (
                      <a
                        key={item.slug}
                        href={item.href || item.slug}
                        data-current={isActive(item.slug) || undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={linkStyles}
                      >
                        {item.title}
                        <LuArrowUpRight />
                      </a>
                    )
                  }

                  return (
                    <Link
                      key={item.slug}
                      href={`/docs/${item.slug}`}
                      data-current={isActive(item.slug) || undefined}
                      className={linkStyles}
                    >
                      <span>{item.title}</span>
                      {item.tag && <Badge variant="solid">{item.tag}</Badge>}
                    </Link>
                  )
                })}
              </Stack>
            )}
          </div>
        )
      })}
    </Stack>
  )
}
