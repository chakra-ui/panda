import { loader } from 'fumadocs-core/source'
import { defineCollections } from 'fumadocs-mdx/macro'
import { z } from 'zod'

const docsCollection = defineCollections({
  type: 'doc',
  dir: 'content/docs',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    hideToc: z.boolean().optional()
  })
})

const blogCollection = defineCollections({
  type: 'doc',
  dir: 'content/blog',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date().transform(value => value.toISOString()),
    author: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .transform(value =>
        value == null ? undefined : Array.isArray(value) ? value : [value]
      ),
    tags: z.array(z.string()).optional(),
    type: z.enum(['article', 'release']).optional(),
    image: z.string().optional()
  })
})

export const docsSource = loader({
  baseUrl: '/docs',
  source: docsCollection.toFumadocsSource()
})

export const blogSource = loader({
  baseUrl: '/blog',
  source: blogCollection.toFumadocsSource()
})

export type DocPage = (typeof docsSource)['$inferPage']
export type BlogPage = (typeof blogSource)['$inferPage']

const frontmatterBlock = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/

/** The MDX body as authored, without frontmatter — what `/llms.txt` and "Copy page" serve. */
export async function getMarkdown(page: DocPage | BlogPage): Promise<string> {
  const raw = await page.data.getText('raw')
  return raw.replace(frontmatterBlock, '').trim()
}

export function getReadingTime(markdown: string): number {
  const words = markdown.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}
