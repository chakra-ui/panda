interface TocEntry {
  title: string
  url: string
  items?: TocEntry[]
}

export interface FlatTocEntry {
  title: string
  url: string
  depth: number
  id: string
}

export const flattenToc = (
  entries: TocEntry[] = [],
  depth = 0
): FlatTocEntry[] =>
  entries.reduce<FlatTocEntry[]>((acc, entry) => {
    const { title, url, items } = entry
    return acc.concat(
      { title, url, depth, id: url.replace(/^#/, '') },
      flattenToc(items, depth + 1)
    )
  }, [])
