'use client'

import { Docs } from '.velite'
import { FlatTocEntry } from '@/lib/flatten-toc'
import { sva } from '@/styled-system/css'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import scrollIntoView from 'scroll-into-view-if-needed'

function useTocState() {
  const [activeId, setActiveId] = useState<string[]>([])
  const rootRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    // Get all headings
    const elements = Array.from(
      document.querySelectorAll('article h2, article h3, article h4')
    ).filter(el => el.id)

    const headingData: FlatTocEntry[] = elements.map(el => ({
      id: el.id,
      title: el.textContent || '',
      url: el.id,
      depth: parseInt(el.tagName.substring(1))
    }))

    setActiveId(headingData.map(item => item.id))

    // Set up intersection observer
    const observer = new IntersectionObserver(
      entries => {
        const intersectingIds = new Set<string>()
        entries.forEach(entry => {
          if (entry.isIntersecting) intersectingIds.add(entry.target.id)
        })
        setActiveId(Array.from(intersectingIds))
      },
      {
        rootMargin: '0px 0px -70% 0px'
      }
    )

    elements.forEach(el => observer.observe(el))

    return () => {
      elements.forEach(el => observer.unobserve(el))
    }
  }, [])

  useEffect(() => {
    if (!activeId.length) return
    const anchorId = activeId[0]

    const anchor = document.querySelector(`li > a[href="#${anchorId}"]`)

    if (anchor) {
      scrollIntoView(anchor, {
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
        scrollMode: 'always',
        boundary: rootRef.current
      })
    }
  }, [activeId])

  return {
    activeId,
    rootRef,
    isCurrent: (id: string) => activeId.includes(id),
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
  const { isCurrent, onLinkClick, rootRef } = useTocState()

  if (data.length === 0) {
    return null
  }

  const classes = tocRecipe()

  return (
    <nav ref={rootRef} className={classes.root} aria-label="Table of contents">
      <h3 className={classes.title}>On this page</h3>
      <ul>
        {data.map(item => (
          <li key={item.id} className={classes.item}>
            <Link
              href={`#${item.id}`}
              style={{ paddingInlineStart: (item.depth - 2) * 4 }}
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
      position: 'sticky',
      top: '20',
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
      display: 'inline-block',
      textStyle: 'sm',
      color: 'gray.500',
      fontWeight: 'normal',
      ps: 'var(--padding-left)',
      py: '0.5',
      borderInlineStartWidth: '1px',
      borderColor: 'transparent',
      transition: 'all',
      _current: {
        color: 'primary.600'
      },
      _hover: {
        color: { base: 'gray.900', _dark: 'gray.300' }
      }
    }
  }
})
