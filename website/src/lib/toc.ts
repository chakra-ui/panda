import type { TOCItemType } from 'fumadocs-core/toc'

export interface TocEntry {
  title: React.ReactNode
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
    title: item.title,
    url: item.url,
    depth: item.depth - root,
    id: item.url.replace(/^#/, '')
  }))
}
