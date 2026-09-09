import { docsSource, getMarkdown, type DocPage } from '@/lib/source'
import { notFound } from 'next/navigation'

interface RouteContext {
  params: Promise<{ slug: string[] }>
}

export const dynamic = 'force-static'

const categoryTitles: Record<string, string> = {
  'get-started': 'Panda CSS Get Started',
  styling: 'Panda CSS Styling',
  theming: 'Panda CSS Theming',
  'design-systems': 'Panda CSS Design Systems',
  reference: 'Panda CSS Reference'
}

export function generateStaticParams() {
  const categoryParams = Object.keys(categoryTitles).map(category => ({
    slug: [category]
  }))

  return [...categoryParams, ...docsSource.generateParams()]
}

export async function GET(request: Request, context: RouteContext) {
  const params = await context.params
  let slugParts = params.slug

  // Remove .mdx extension from the last part if present
  const lastPart = slugParts[slugParts.length - 1]
  if (lastPart.endsWith('.mdx')) {
    slugParts = [
      ...slugParts.slice(0, -1),
      lastPart.slice(0, -4) // Remove .mdx
    ]
  }

  // Check if this is a specific doc request (e.g., /installation/redwood)
  if (slugParts.length > 1) {
    const page = docsSource.getPage(slugParts)

    if (!page) {
      notFound()
    }

    const content = await generateSingleDocContent(page)

    return new Response(content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Robots-Tag': 'noindex',
        'Cache-Control': 'public, max-age=3600'
      }
    })
  }

  // Category level request (e.g., /installation)
  const category = slugParts[0]

  const categoryPages = docsSource
    .getPages()
    .filter(page => page.slugs[0] === category)
    .sort((a, b) => a.url.localeCompare(b.url))

  if (categoryPages.length === 0) {
    notFound()
  }

  const content = await generateCategoryContent(category, categoryPages)

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Robots-Tag': 'noindex',
      'Cache-Control': 'public, max-age=3600'
    }
  })
}

async function generateSingleDocContent(page: DocPage) {
  return `# ${page.data.title}

${page.data.description || ''}

${await getMarkdown(page)}

---

_This content is automatically generated from the official Panda CSS documentation._
`
}

async function generateCategoryContent(category: string, pages: DocPage[]) {
  const sections = (
    await Promise.all(
      pages.map(async page => {
        const headerLevel = '#'.repeat(Math.min(page.slugs.length, 6))

        return `
${headerLevel} ${page.data.title}

${page.data.description || ''}

${await getMarkdown(page)}
`
      })
    )
  ).join('\n\n---\n\n')

  return `# ${categoryTitles[category] || category}

> This document contains all ${category} documentation for Panda CSS

## Table of Contents

${pages.map(page => `- [${page.data.title}](#${page.data.title.toLowerCase().replace(/\s+/g, '-')})`).join('\n')}

---

${sections}

---

_This content is automatically generated from the official Panda CSS documentation._
`
}
