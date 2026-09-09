import type { TOCItemType } from 'fumadocs-core/toc'
import { Children, isValidElement, type ReactNode } from 'react'

export interface TocEntry {
  title: string
  url: string
  /** Nesting level relative to the shallowest heading on the page. */
  depth: number
  id: string
}

/** Rebases fumadocs' absolute heading levels (h2 → 2) onto 0-based nesting. */
export function toTocEntries(toc: TOCItemType[]): TocEntry[] {
  if (toc.length === 0) return []

  const root = Math.min(...toc.map(item => item.depth))

  return toc.map(item => ({
    title: toText(item.title),
    url: item.url,
    depth: item.depth - root,
    id: item.url.replace(/^#/, '')
  }))
}

/** Heading text without inline markup, so `<code>` in a heading reads as plain text in the rail. */
function toText(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return toText(node.props.children)
  }
  return Children.toArray(node).map(toText).join('')
}
