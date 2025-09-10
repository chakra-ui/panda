'use client'

import { Docs } from '.velite'
import { sva } from '@/styled-system/css'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import scrollIntoView from 'scroll-into-view-if-needed'

interface HeadingState {
  index: number
  aboveHalfViewport: boolean
  insideHalfViewport: boolean
  isActive: boolean
}

function useTocState() {
  const [headingStates, setHeadingStates] = useState<
    Record<string, HeadingState>
  >({})
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    // Get all headings
    const elements = Array.from(
      document.querySelectorAll('article h2, article h3, article h4')
    ).filter(el => el.id)

    if (elements.length === 0) return

    // Create a map of elements to their ids and indices
    const elementMap = new Map()
    elements.forEach((el, index) => {
      elementMap.set(el, [el.id, index])
    })

    // Clean up existing observer before creating a new one
    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }

    // Set up intersection observer with sophisticated tracking
    observerRef.current = new IntersectionObserver(
      entries => {
        setHeadingStates(prevStates => {
          const newStates = { ...prevStates }

          // Update states based on intersection entries
          for (const entry of entries) {
            if (entry?.rootBounds && elementMap.has(entry.target)) {
              const [id, index] = elementMap.get(entry.target)
              const aboveHalfViewport =
                entry.boundingClientRect.y + entry.boundingClientRect.height <=
                entry.rootBounds.y + entry.rootBounds.height
              const insideHalfViewport = entry.intersectionRatio > 0

              newStates[id] = {
                index,
                aboveHalfViewport,
                insideHalfViewport,
                isActive: false
              }
            }
          }

          // Determine which headings should be active
          const activeIds = new Set<string>()

          // First, mark all visible headings as active
          for (const id in newStates) {
            newStates[id].isActive = false

            if (newStates[id].insideHalfViewport) {
              activeIds.add(id)
            }
          }

          // If no headings are visible, find the most relevant one
          if (activeIds.size === 0) {
            let fallbackId = ''
            let largestIndexAboveViewport = -1

            // Look for the last heading that passed above the viewport
            for (const id in newStates) {
              if (
                newStates[id].aboveHalfViewport &&
                newStates[id].index > largestIndexAboveViewport
              ) {
                largestIndexAboveViewport = newStates[id].index
                fallbackId = id
              }
            }

            // If still no heading found and we're near the bottom, activate the last heading
            if (!fallbackId) {
              const isNearBottom =
                window.innerHeight + window.scrollY >=
                document.documentElement.scrollHeight - 100

              if (isNearBottom) {
                const allIds = Object.keys(newStates)
                if (allIds.length > 0) {
                  fallbackId = allIds.reduce((maxId, id) =>
                    newStates[id].index > newStates[maxId].index ? id : maxId
                  )
                }
              }
            }

            if (fallbackId) {
              activeIds.add(fallbackId)
            }
          }

          // Mark all active headings
          for (const id of activeIds) {
            if (newStates[id]) {
              newStates[id].isActive = true
            }
          }

          return newStates
        })
      },
      {
        rootMargin: '0px 0px -20%',
        threshold: [0, 0.1]
      }
    )

    elements.forEach(el => observerRef.current?.observe(el))

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    // Find the active heading for auto-scrolling TOC
    const activeId = Object.keys(headingStates).find(
      id => headingStates[id]?.isActive
    )
    if (!activeId) return

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      const anchor = document.querySelector(`li > a[href="#${activeId}"]`)

      if (anchor) {
        // Find the scrollable container (parent with overflow-y auto)
        const scrollContainer = anchor.closest('.scroll-area')

        if (scrollContainer) {
          scrollIntoView(anchor, {
            behavior: 'smooth',
            block: 'center',
            inline: 'center',
            scrollMode: 'if-needed',
            boundary: scrollContainer
          })
        }
      }
    })
  }, [headingStates])

  return {
    isCurrent: (id: string) => headingStates[id]?.isActive || false,
    onLinkClick: (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      e.preventDefault()
      const element = document.getElementById(id)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
        window.history.pushState(null, '', `#${id}`)
      }
    }
  }
}

export interface TocProps {
  data: Docs['toc']
}

export const Toc = (props: TocProps) => {
  const { data } = props
  const { isCurrent, onLinkClick } = useTocState()

  if (data.length === 0) {
    return null
  }

  const classes = tocRecipe()

  return (
    <nav className={classes.root} aria-label="Table of contents">
      <h3 className={classes.title}>On this page</h3>
      <ul>
        {data.map(item => (
          <li key={item.id} className={classes.item}>
            <Link
              href={`#${item.id}`}
              style={{ paddingInlineStart: item.depth * 12 }}
              data-current={isCurrent(item.id) || undefined}
              className={classes.link}
              onClick={e => onLinkClick(e, item.id)}
            >
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

const tocRecipe = sva({
  slots: ['root', 'title', 'link', 'item'],
  base: {
    root: {
      ps: '4'
    },
    title: {
      textStyle: 'sm',
      fontWeight: 'medium',
      letterSpacing: 'tight',
      mb: '4'
    },
    item: {
      my: '2',
      scrollMarginY: '6',
      scrollPaddingY: '6'
    },
    link: {
      display: 'inline-flex',
      textStyle: 'sm',
      color: 'fg.subtle',
      py: '0.5',
      transitionProperty: 'color',
      transitionDuration: '200ms',
      _current: {
        color: 'fg',
        fontWeight: 'medium'
      },
      _hover: {
        color: 'fg'
      }
    }
  }
})
