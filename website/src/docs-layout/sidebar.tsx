'use client'

import { docsNavigation, type NavItem } from '@/docs.config'
import { ChevronDownIcon, ChevronRightIcon } from '@/icons'
import { css } from '@/styled-system/css'
import { Box, Stack } from '@/styled-system/jsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

interface SidebarItem {
  title: string
  slug: string
  children?: SidebarItem[]
}

interface DocsSidebarProps {
  currentSlug?: string
}

export function DocsSidebar({ currentSlug }: DocsSidebarProps) {
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
        slug: `${section.url}/${item.url}`
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
    <Box as="nav" px="4">
      <Stack gap="1">
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
                  color: 'fg.default',
                  transition: 'colors',
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
                <Stack gap="0.5" mt="1" ml="2">
                  {section.children.map(item => (
                    <Link
                      key={item.slug}
                      href={`/docs/${item.slug}`}
                      className={css({
                        display: 'block',
                        px: 3,
                        py: 1.5,
                        rounded: 'md',
                        fontSize: 'sm',
                        color: isActive(item.slug)
                          ? 'accent.default'
                          : 'fg.muted',
                        bg: isActive(item.slug)
                          ? 'accent.subtle'
                          : 'transparent',
                        fontWeight: isActive(item.slug) ? 'medium' : 'normal',
                        transition: 'all',
                        _hover: {
                          color: isActive(item.slug)
                            ? 'accent.default'
                            : 'fg.default',
                          bg: isActive(item.slug)
                            ? 'accent.subtle'
                            : 'bg.subtle'
                        }
                      })}
                    >
                      {item.title}
                    </Link>
                  ))}
                </Stack>
              )}
            </div>
          )
        })}
      </Stack>
    </Box>
  )
}
