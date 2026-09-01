import { useEffect, useRef } from 'react'

/** The nearest ancestor that actually scrolls, so we never nudge the page. */
function getScrollParent(node: HTMLElement | null) {
  for (let el = node?.parentElement; el; el = el.parentElement) {
    const { overflowY } = getComputedStyle(el)
    const scrolls = overflowY === 'auto' || overflowY === 'scroll'
    if (scrolls && el.scrollHeight > el.clientHeight) return el
  }
  return null
}

interface Options {
  /** Active heading id for a table of contents, route for a nav. */
  activeKey: string | null | undefined
  /** `auto` where the marker moves on navigation and easing looks wrong. */
  behavior?: ScrollBehavior
}

/**
 * Scrolls only the nearest scrollable ancestor, unlike `scrollIntoView`, which
 * walks all of them and would fight the page scroll that triggered the change.
 */
export function useScrollActiveIntoView<T extends HTMLElement>(
  options: Options
) {
  const { activeKey, behavior = 'smooth' } = options
  const ref = useRef<T>(null)

  useEffect(() => {
    if (!activeKey) return

    const root = ref.current
    const active = root?.querySelector<HTMLElement>('[data-current]')
    const scroller = getScrollParent(root)
    if (!active || !scroller) return

    const item = active.getBoundingClientRect()
    const view = scroller.getBoundingClientRect()
    if (item.top >= view.top && item.bottom <= view.bottom) return

    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    scroller.scrollTo({
      top:
        scroller.scrollTop +
        (item.top - view.top) -
        (view.height - item.height) / 2,
      behavior: reduced ? 'auto' : behavior
    })
  }, [activeKey, behavior])

  return ref
}
