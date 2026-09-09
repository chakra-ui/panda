'use client'

import type { TocEntry } from '@/lib/toc'
import { useScrollActiveIntoView } from '@/lib/use-scroll-active-into-view'
import { docNav } from '@/styled-system/recipes'
import Link from 'next/link'
import { useEffect, useState } from 'react'

function useTocState(ids: string[]) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const key = ids.join(',')

  useEffect(() => {
    const listed = new Set(key.split(','))
    let frame = 0

    const read = () => {
      frame = 0

      const visible = Array.from(
        document.querySelectorAll<HTMLElement>(
          'article h2, article h3, article h4'
        )
      ).filter(el => listed.has(el.id) && el.offsetParent !== null)

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
  }, [key])

  return {
    activeId,
    isCurrent: (id: string) => id === activeId,
    onLinkClick: (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      e.preventDefault()
      const element = document.getElementById(id)
      if (!element) return

      const reduced = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches
      element.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' })
      window.history.pushState(null, '', `#${id}`)
    }
  }
}

export interface TocProps {
  data: TocEntry[]
  /** The sheet renders its own header, so it hides this one. */
  hideTitle?: boolean
}

export const Toc = (props: TocProps) => {
  const { data, hideTitle } = props
  const { activeId, isCurrent, onLinkClick } = useTocState(
    data.map(item => item.id)
  )
  const navRef = useScrollActiveIntoView<HTMLElement>({ activeKey: activeId })

  if (data.length === 0) {
    return null
  }

  const classes = docNav({ kind: 'toc' })

  return (
    <nav ref={navRef} aria-label="Table of contents">
      {!hideTitle && <h3 className={classes.label}>On this page</h3>}
      <ul className={classes.list}>
        {data.map(item => (
          <li key={item.id}>
            <Link
              href={`#${item.id}`}
              data-current={isCurrent(item.id) || undefined}
              aria-current={isCurrent(item.id) ? 'location' : undefined}
              className={classes.link}
              style={
                {
                  '--toc-depth': Math.min(item.depth, MAX_DEPTH)
                } as React.CSSProperties
              }
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

/** Past this, the indent eats more of the rail than the heading is worth. */
const MAX_DEPTH = 3
