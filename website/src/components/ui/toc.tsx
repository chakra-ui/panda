'use client'

import { Docs } from '.velite'
import { sva } from '@/styled-system/css'
import Link from 'next/link'
import { useEffect, useState } from 'react'

function useTocState() {
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    let frame = 0

    const read = () => {
      frame = 0

      const visible = Array.from(
        document.querySelectorAll<HTMLElement>(
          'article h2, article h3, article h4'
        )
      ).filter(el => el.id && el.offsetParent !== null)

      if (visible.length === 0) return

      const line = 140
      let current = visible[0]

      for (const heading of visible) {
        if (heading.getBoundingClientRect().top > line) break
        current = heading
      }

      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2

      setActiveId(atBottom ? visible[visible.length - 1].id : current.id)
    }

    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(read)
    }

    read()

    const article = document.querySelector('article')
    const observer = article ? new ResizeObserver(schedule) : null
    if (article && observer) observer.observe(article)

    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)

    return () => {
      if (frame !== 0) cancelAnimationFrame(frame)
      observer?.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])

  return {
    isCurrent: (id: string) => id === activeId,
    onLinkClick: (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      e.preventDefault()
      const element = document.getElementById(id)
      if (!element) return

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      element.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' })
      window.history.pushState(null, '', `#${id}`)
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
              style={{ paddingInlineStart: 16 + item.depth * 12 }}
              data-current={isCurrent(item.id) || undefined}
              aria-current={isCurrent(item.id) ? 'location' : undefined}
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
      '& > ul': {
        borderInlineStartWidth: '1px',
        borderColor: 'border'
      }
    },
    title: {
      textStyle: 'xs',
      fontFamily: 'mono',
      fontWeight: 'medium',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      color: 'fg.subtle',
      mb: '8'
    },
    item: {
      scrollMarginY: '6',
      scrollPaddingY: '6'
    },
    link: {
      position: 'relative',
      display: 'flex',
      ml: '-1px',
      py: '1',
      pe: '3',
      textStyle: 'sm',
      fontWeight: 'medium',
      color: 'fg.subtle',
      transitionProperty: 'color',
      transitionDuration: '150ms',
      _before: {
        content: '""',
        position: 'absolute',
        insetY: '0',
        insetStart: '0',
        width: '2px',
        bg: 'transparent',
        transitionProperty: 'background-color',
        transitionDuration: '150ms'
      },
      _current: {
        color: 'fg',
        _before: { bg: 'accent.emphasis' }
      },
      _hover: {
        color: 'fg'
      }
    }
  }
})
