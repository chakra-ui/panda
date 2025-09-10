import { docs } from '.velite'

export const dynamic = 'force-static'

export async function GET() {
  // Sort all docs by slug for consistent ordering
  const sortedDocs = docs.sort((a, b) => a.slug.localeCompare(b.slug))

  // Group docs by category
  const categories = [
    { key: 'overview', title: 'Overview' },
    { key: 'installation', title: 'Installation' },
    { key: 'concepts', title: 'Concepts' },
    { key: 'theming', title: 'Theming' },
    { key: 'utilities', title: 'Utilities' },
    { key: 'customization', title: 'Customization' },
    { key: 'guides', title: 'Guides' },
    { key: 'migration', title: 'Migration' },
    { key: 'references', title: 'References' }
  ]

  const content = generateFullDocumentation(sortedDocs, categories)

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  })
}

function generateFullDocumentation(
  docs: typeof import('.velite').docs,
  categories: Array<{ key: string; title: string }>
) {
  const tocEntries: string[] = []
  const sections: string[] = []

  categories.forEach(category => {
    const categoryDocs = docs.filter(doc =>
      doc.slug.startsWith(`docs/${category.key}`)
    )

    if (categoryDocs.length === 0) return

    tocEntries.push(`\n### ${category.title}`)
    categoryDocs.forEach(doc => {
      tocEntries.push(
        `- [${doc.title}](#${doc.title.toLowerCase().replace(/\s+/g, '-')})`
      )
    })

    sections.push(`\n# ${category.title}\n`)

    categoryDocs.forEach(doc => {
      const slug = doc.slug.replace('docs/', '')
      const level = slug.split('/').length
      const headerLevel = '#'.repeat(Math.min(level, 6))

      sections.push(`
${headerLevel} ${doc.title}

${doc.description || ''}

${doc.llm}

---
`)
    })
  })

  return `# Panda CSS Complete Documentation

> Panda CSS is a CSS-in-JS framework with build-time optimizations for styling web applications

This document contains the complete Panda CSS documentation, organized by category for easy navigation.

## Table of Contents
${tocEntries.join('\n')}

---
${sections.join('\n')}

---

_This is the complete Panda CSS documentation, automatically generated from the official sources._
`
}
