import { notFound } from 'next/navigation'
import { docs } from '.velite'

interface RouteContext {
  params: Promise<{ slug: string[] }>
}

export const dynamic = 'force-static'

export async function generateStaticParams() {
  const categories = [
    'overview',
    'installation', 
    'concepts',
    'theming',
    'utilities',
    'customization',
    'guides',
    'migration',
    'references'
  ]
  
  // Generate params for category pages
  const categoryParams = categories.map(category => ({
    slug: [category]
  }))
  
  // Generate params for individual doc pages
  const docParams = docs.map(doc => {
    const slugParts = doc.slug.replace('docs/', '').split('/')
    return {
      slug: slugParts
    }
  })
  
  return [...categoryParams, ...docParams]
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
    const fullSlug = `docs/${slugParts.join('/')}`
    const doc = docs.find(d => d.slug === fullSlug)
    
    if (!doc) {
      notFound()
    }
    
    // Generate content for a single doc
    const content = generateSingleDocContent(doc)
    
    return new Response(content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600'
      }
    })
  }
  
  // Category level request (e.g., /installation)
  const category = slugParts[0]

  // Filter docs by category
  const categoryDocs = docs.filter(doc => 
    doc.slug.startsWith(`docs/${category}`)
  )

  if (categoryDocs.length === 0) {
    notFound()
  }

  // Sort docs by slug for consistent ordering
  const sortedDocs = categoryDocs.sort((a, b) => a.slug.localeCompare(b.slug))

  // Build the content
  const content = generateCategoryContent(category, sortedDocs)

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  })
}

function generateSingleDocContent(doc: typeof import('.velite').docs[0]) {
  return `# ${doc.title}

${doc.description || ''}

${doc.llm}

---

_This content is automatically generated from the official Panda CSS documentation._
`
}

function generateCategoryContent(category: string, docs: typeof import('.velite').docs) {
  const categoryTitles: Record<string, string> = {
    overview: 'Panda CSS Overview',
    installation: 'Panda CSS Installation Guides',
    concepts: 'Panda CSS Core Concepts',
    theming: 'Panda CSS Theming',
    utilities: 'Panda CSS Utilities',
    customization: 'Panda CSS Customization',
    guides: 'Panda CSS Guides',
    migration: 'Panda CSS Migration Guides',
    references: 'Panda CSS References'
  }

  const sections = docs.map(doc => {
    const title = doc.title
    const slug = doc.slug.replace('docs/', '')
    const level = slug.split('/').length - 1
    const headerLevel = '#'.repeat(Math.min(level + 1, 6))
    
    return `
${headerLevel} ${title}

${doc.description || ''}

${doc.llm}
`
  }).join('\n\n---\n\n')

  return `# ${categoryTitles[category] || category}

> This document contains all ${category} documentation for Panda CSS

## Table of Contents

${docs.map(doc => `- [${doc.title}](#${doc.title.toLowerCase().replace(/\s+/g, '-')})`).join('\n')}

---

${sections}

---

_This content is automatically generated from the official Panda CSS documentation._
`
}
