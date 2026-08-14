'use client'

import { communityLinks, docsTabs, type TabItem } from '@/docs.config'
import { css } from '@/styled-system/css'
import { Box, HStack } from '@/styled-system/jsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  LuBlocks,
  LuBookOpen,
  LuChevronDown,
  LuPaintbrush,
  LuPalette,
  LuUsers
} from 'react-icons/lu'
import type { IconType } from 'react-icons'

export const TAB_ICONS: Record<string, IconType> = {
  styling: LuPaintbrush,
  theming: LuPalette,
  'design-systems': LuBlocks,
  reference: LuBookOpen
}

/**
 * The persistent tab bar for the docs shell. Styling / Theming / Design Systems
 * on the left (build intents), References on the right (cross-cutting lookup),
 * plus a plain Blog link. Active tab is derived from the URL's first `/docs/:key`
 * segment, so it stays in sync with server-rendered navigation with no extra state.
 *
 * Hugs the real page edge with a small fixed `px`, same as the sidebar below it,
 * instead of sitting inside a `maxW` centered column. A centered shell only
 * matches the sidebar's position up to that maxW; past it, the two drift apart.
 *
 * Every tab shows its own underline (`border` at rest, `accent` when active,
 * `fg.muted` on hover), stretched to the row's full height so it always sits at
 * the same baseline. Hover also adds a subtle background pill, matching the
 * sidebar's own group-header hover treatment.
 */
export function TabBar() {
  const pathname = usePathname()
  const activeKey = pathname?.split('/')[2]

  const left = docsTabs.filter(tab => tab.side === 'left')
  const right = docsTabs.filter(tab => tab.side === 'right')

  return (
    <Box
      as="nav"
      aria-label="Docs sections"
      borderBottomWidth="1px"
      borderColor="border"
      bg="bg"
    >
      <HStack
        gap="1"
        px="6"
        overflowX="auto"
        className="scroll-area"
        alignItems="stretch"
      >
        <HStack gap="1" flexShrink="0" alignItems="stretch">
          {left.map(tab => (
            <TabLink key={tab.key} tab={tab} active={tab.key === activeKey} />
          ))}
        </HStack>
        <HStack gap="1" ml="auto" alignItems="stretch" flexShrink="0">
          {right.map(tab => (
            <TabLink key={tab.key} tab={tab} active={tab.key === activeKey} />
          ))}
          <CommunityMenu />
          <a
            href="/blog"
            className={css({
              display: 'flex',
              alignItems: 'center',
              textStyle: 'sm',
              fontWeight: 'semibold',
              color: 'fg.muted',
              px: '3',
              py: '3',
              whiteSpace: 'nowrap',
              rounded: 'md',
              transitionProperty: 'color, background',
              transitionDuration: '200ms',
              _hover: { color: 'fg', bg: 'bg.subtle' }
            })}
          >
            Blog
          </a>
        </HStack>
      </HStack>
    </Box>
  )
}

/**
 * "Community" is a dropdown, not a routed tab: Team and Showcase are full
 * marketing pages at their own routes, and the rest (Discord, GitHub, Roadmap,
 * Changelog, Contributing) are external links. There's no `/docs/community`
 * content for it to route to.
 *
 * The panel renders through a portal into `document.body`, positioned via the
 * button's own bounding rect. The tab bar's row has `overflowX: auto` for
 * horizontal scrolling on mobile, and per the CSS spec, setting overflow-x to
 * anything but `visible` forces overflow-y to clip too, so an absolutely
 * positioned panel nested inside that row gets silently cut off. Portaling it
 * out avoids that ancestor entirely.
 */
function CommunityMenu() {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, right: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        panelRef.current &&
        !panelRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    function onViewportChange() {
      setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('scroll', onViewportChange, true)
    window.addEventListener('resize', onViewportChange)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', onViewportChange, true)
      window.removeEventListener('resize', onViewportChange)
    }
  }, [open])

  function toggleOpen() {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setCoords({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    }
    setOpen(v => !v)
  }

  return (
    <Box position="relative" flexShrink="0">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggleOpen}
        className={css({
          display: 'flex',
          alignItems: 'center',
          gap: '2',
          textStyle: 'sm',
          fontWeight: 'semibold',
          px: '3',
          py: '3',
          h: 'full',
          rounded: 'md',
          whiteSpace: 'nowrap',
          color: open ? 'fg' : 'fg.muted',
          transitionProperty: 'color, background',
          transitionDuration: '200ms',
          _hover: { color: 'fg', bg: 'bg.subtle' }
        })}
      >
        <LuUsers size={16} />
        Community
        <LuChevronDown size={14} />
      </button>
      {open &&
        createPortal(
          <div
            ref={panelRef}
            role="menu"
            style={{ position: 'fixed', top: coords.top, right: coords.right }}
            className={css({
              minW: '12rem',
              bg: 'bg',
              borderWidth: '1px',
              borderColor: 'border',
              rounded: 'md',
              shadow: 'lg',
              py: '1',
              zIndex: '20'
            })}
          >
            {communityLinks.map(link => (
              <a
                key={link.title}
                role="menuitem"
                href={link.href}
                target={link.external ? '_blank' : undefined}
                rel={link.external ? 'noopener noreferrer' : undefined}
                onClick={() => setOpen(false)}
                className={css({
                  display: 'block',
                  textStyle: 'sm',
                  color: 'fg.muted',
                  px: '3',
                  py: '2',
                  _hover: { color: 'fg', bg: 'bg.subtle' }
                })}
              >
                {link.title}
              </a>
            ))}
          </div>,
          document.body
        )}
    </Box>
  )
}

interface TabLinkProps {
  tab: TabItem
  active: boolean
}

function TabLink({ tab, active }: TabLinkProps) {
  const Icon = TAB_ICONS[tab.key]

  return (
    <Link
      href={`/docs/${tab.key}`}
      aria-current={active || undefined}
      className={css({
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: '2',
        textStyle: 'sm',
        fontWeight: 'semibold',
        px: '3',
        py: '3',
        rounded: 'md',
        whiteSpace: 'nowrap',
        color: active ? 'fg' : 'fg.muted',
        transitionProperty: 'color, background',
        transitionDuration: '200ms',
        _hover: {
          color: 'fg',
          bg: 'bg.subtle',
          _after: { bg: active ? 'accent' : 'fg.muted' }
        },
        _after: {
          content: '""',
          position: 'absolute',
          left: '3',
          right: '3',
          bottom: '-1px',
          height: '2px',
          bg: active ? 'accent' : 'border',
          transitionProperty: 'background',
          transitionDuration: '200ms'
        }
      })}
    >
      {Icon && <Icon size={16} />}
      {tab.title}
    </Link>
  )
}
