import { type Docs as Doc } from '.velite'
import Fuse from 'fuse.js'

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
}

export interface SearchIndex {
  generated: string
  totalRecords: number
  records: SearchRecord[]
}

export interface SearchItem {
  label: string
  value: string
  category: string
  description: string
  content?: string
  type?: 'page' | 'heading'
}

/**
 * Extract content for each heading section from the full document
 */
function extractSectionContent(
  fullContent: string,
  toc: Doc['toc'],
  currentIndex: number
): string {
  const currentHeading = toc[currentIndex]
  const nextHeading = toc[currentIndex + 1]

  // Find the start position of current heading in content
  const currentHeadingPattern = new RegExp(
    `#+\\s*${escapeRegExp(currentHeading.title)}`,
    'i'
  )
  const currentMatch = fullContent.match(currentHeadingPattern)

  if (!currentMatch) {
    return ''
  }

  const startIndex = currentMatch.index!

  // Find end position (start of next heading or end of document)
  let endIndex = fullContent.length
  if (nextHeading) {
    const nextHeadingPattern = new RegExp(
      `#+\\s*${escapeRegExp(nextHeading.title)}`,
      'i'
    )
    const nextMatch = fullContent
      .slice(startIndex + currentMatch[0].length)
      .match(nextHeadingPattern)
    if (nextMatch) {
      endIndex = startIndex + currentMatch[0].length + nextMatch.index!
    }
  }

  // Extract and clean the content
  const content = fullContent
    .slice(startIndex, endIndex)
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`[^`]*`/g, '') // Remove inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
    .replace(/#+\s*/g, '') // Remove heading markers
    .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
    .trim()

  return content
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Create a unique ID for search records
 */
function createSearchId(baseSlug: string, headingId?: string): string {
  return headingId ? `${baseSlug}#${headingId}` : baseSlug
}

/**
 * Generate breadcrumb for better context
 */
function generateBreadcrumb(doc: Doc, heading?: Doc['toc'][0]): string[] {
  const breadcrumb = ['Docs', doc.title]
  if (heading) {
    breadcrumb.push(heading.title)
  }
  return breadcrumb
}

/**
 * Transform Velite docs to search-optimized records
 */
export function getSearchIndex(docs: Doc[]): SearchIndex {
  const searchRecords: SearchRecord[] = []

  // Process each document
  for (const doc of docs) {
    const baseUrl = `/docs/${doc.slug}`

    // Add main page record
    const pageRecord: SearchRecord = {
      id: createSearchId(doc.slug),
      url: baseUrl,
      title: doc.title,
      content: doc.llm,
      type: 'page',
      description: doc.description || doc.llm.slice(0, 150) + '...',
      breadcrumb: generateBreadcrumb(doc)
    }
    searchRecords.push(pageRecord)

    // Add heading-level records
    for (let i = 0; i < doc.toc.length; i++) {
      const heading = doc.toc[i]
      const sectionContent = extractSectionContent(doc.llm, doc.toc, i)

      if (sectionContent.length > 50) {
        // Only index substantial content
        const headingRecord: SearchRecord = {
          id: createSearchId(doc.slug, heading.id),
          url: `${baseUrl}${heading.url}`,
          title: heading.title,
          content: sectionContent,
          type: 'heading',
          pageTitle: doc.title,
          headingLevel: heading.depth,
          description: sectionContent.slice(0, 150) + '...',
          breadcrumb: generateBreadcrumb(doc, heading)
        }
        searchRecords.push(headingRecord)
      }
    }
  }

  return {
    generated: new Date().toISOString(),
    totalRecords: searchRecords.length,
    records: searchRecords
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
    // Show recent or popular items when no search query
    const popularItems = items.filter(item => item.type === 'page').slice(0, 5)

    return popularItems.length ? { '': popularItems } : {}
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
