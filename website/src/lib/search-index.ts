import type { StructuredData } from 'fumadocs-core/mdx-plugins/remark-structure'
import Fuse from 'fuse.js'

export type SearchSection = 'Docs' | 'Reference' | 'Blog'

/** The tab a result belongs to, derived from its url. */
export function sectionOf(url: string): SearchSection {
  if (url.startsWith('/blog')) return 'Blog'
  if (url.startsWith('/docs/reference')) return 'Reference'
  return 'Docs'
}

export interface SearchRecord {
  id: string
  url: string
  title: string
  content: string
  type: 'page' | 'heading'
  pageTitle?: string
  headingLevel?: number
  description?: string
  breadcrumb?: string[]
  section?: SearchSection
}

export interface SearchIndex {
  generated: string
  totalRecords: number
  records: SearchRecord[]
}

export interface SearchItem {
  label: string
  value: string
  section: SearchSection
  category: string
  description: string
  content?: string
  type?: 'page' | 'heading'
}

export interface SearchDocInput {
  url: string
  title: string
  description?: string
  structuredData: StructuredData
}

export interface SearchPostInput {
  url: string
  title: string
  description?: string
}

/**
 * Build the search index from the structured data emitted at build time.
 */
export function getSearchIndex(
  docs: SearchDocInput[],
  posts: SearchPostInput[] = []
): SearchIndex {
  const searchRecords: SearchRecord[] = []

  for (const doc of docs) {
    const { headings, contents } = doc.structuredData

    const pageContent = contents.map(entry => entry.content).join('\n')

    searchRecords.push({
      id: doc.url,
      url: doc.url,
      title: doc.title,
      content: pageContent,
      type: 'page',
      description: doc.description || pageContent.slice(0, 150) + '...',
      breadcrumb: [doc.title]
    })

    for (const heading of headings) {
      const sectionContent = contents
        .filter(entry => entry.heading === heading.id)
        .map(entry => entry.content)
        .join('\n')

      // Only index substantial content
      if (sectionContent.length <= 50) continue

      searchRecords.push({
        id: `${doc.url}#${heading.id}`,
        url: `${doc.url}#${heading.id}`,
        title: heading.content,
        content: sectionContent,
        type: 'heading',
        pageTitle: doc.title,
        description: sectionContent.slice(0, 150) + '...',
        breadcrumb: [doc.title]
      })
    }
  }

  for (const post of posts) {
    searchRecords.push({
      id: post.url,
      url: post.url,
      title: post.title,
      content: post.description ?? post.title,
      type: 'page',
      description: post.description ?? '',
      breadcrumb: ['Blog']
    })
  }

  return {
    generated: new Date().toISOString(),
    totalRecords: searchRecords.length,
    records: searchRecords.map(record => ({
      ...record,
      section: sectionOf(record.url)
    }))
  }
}

/**
 * Convert search records to search items for UI
 */
export function convertToSearchItems(searchIndex: SearchIndex): SearchItem[] {
  return searchIndex.records.map(
    (record: SearchRecord): SearchItem => ({
      label: record.title,
      value: record.url,
      section: record.section ?? sectionOf(record.url),
      category: record.breadcrumb?.join(' › ') || 'Documentation',
      description: record.description || '',
      content: record.content,
      type: record.type
    })
  )
}

/**
 * Filter and group search items based on query using Fuse.js
 */
export function filterSearchItems(
  items: SearchItem[],
  _searchIndex: SearchIndex,
  query: string
): Record<string, SearchItem[]> {
  if (!query) {
    // No query: hand back every page so the caller can scope by section itself.
    const pages = items.filter(item => item.type === 'page')
    return pages.length ? { '': pages } : {}
  }

  // Configure Fuse.js for better fuzzy search
  const fuseOptions = {
    keys: [
      { name: 'label', weight: 0.5 }, // Title gets highest weight
      { name: 'description', weight: 0.2 }, // Description
      { name: 'content', weight: 0.2 }, // Content matching
      { name: 'category', weight: 0.1 } // Category/breadcrumb
    ],
    threshold: 0.2, // More strict matching
    distance: 100, // Maximum allowed distance
    location: 0, // Prefer matches at beginning
    minMatchCharLength: 2, // Minimum character match length
    includeScore: true, // Include relevance score
    includeMatches: true, // Include match details
    ignoreLocation: false, // Consider match position
    findAllMatches: true, // Find all matching patterns
    useExtendedSearch: true // Enable advanced search patterns
  }

  const fuse = new Fuse(items, fuseOptions)
  const results = fuse.search(query)

  // Sort results: pages before headings, then by score
  const sortedResults = results
    .sort((a, b) => {
      // First sort by type preference (pages before headings)
      if (a.item.type === 'page' && b.item.type === 'heading') return -1
      if (a.item.type === 'heading' && b.item.type === 'page') return 1

      // Then sort by Fuse score (lower score = better match)
      return (a.score || 1) - (b.score || 1)
    })
    .map(result => result.item)
    .slice(0, 15)

  return sortedResults.length > 0 ? { '': sortedResults } : {}
}
