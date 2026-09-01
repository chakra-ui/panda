import { docsSource, getMarkdown, type DocPage } from '@/lib/source'

export const dynamic = 'force-static'

const categories = [
  { key: 'get-started', title: 'Get Started' },
  { key: 'styling', title: 'Styling' },
  { key: 'theming', title: 'Theming' },
  { key: 'design-systems', title: 'Design Systems' },
  { key: 'reference', title: 'Reference' }
]

export async function GET() {
  const sortedPages = docsSource
    .getPages()
    .sort((a, b) => a.url.localeCompare(b.url))

  const content = await generateFullDocumentation(sortedPages)

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  })
}

async function generateFullDocumentation(pages: DocPage[]) {
  const tocEntries: string[] = []
  const sections: string[] = []

  for (const category of categories) {
    const categoryPages = pages.filter(page => page.slugs[0] === category.key)

    if (categoryPages.length === 0) continue

    tocEntries.push(`\n### ${category.title}`)
    for (const page of categoryPages) {
      tocEntries.push(
        `- [${page.data.title}](#${page.data.title.toLowerCase().replace(/\s+/g, '-')})`
      )
    }

    sections.push(`\n# ${category.title}\n`)

    for (const page of categoryPages) {
      const headerLevel = '#'.repeat(Math.min(page.slugs.length, 6))

      sections.push(`
${headerLevel} ${page.data.title}

${page.data.description || ''}

${await getMarkdown(page)}

---
`)
    }
  }

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
