import rehypeShiki from '@shikijs/rehype'
import {
  transformerMetaHighlight,
  transformerMetaWordHighlight,
  transformerNotationDiff,
  transformerNotationFocus,
  transformerNotationHighlight,
  transformerNotationWordHighlight
} from '@shikijs/transformers'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeSlug from 'rehype-slug'
import type { ShikiTransformer } from 'shiki'
import { visit } from 'unist-util-visit'
import { defineCollection, defineConfig, s } from 'velite'
import { flattenToc } from './src/lib/flatten-toc'

function remarkCodeTitle() {
  return (tree: any, file: any) => {
    visit(tree, 'code', (node, index, parent) => {
      const metaString = `${node.lang ?? ''} ${node.meta ?? ''}`.trim()

      if (!metaString) return
      const [filename] = metaString.match(
        /(?<=filename=("|'))(.*?)(?=("|'))/
      ) ?? ['']

      if (!filename && metaString.includes('filename=')) {
        file.message('Invalid title', node, 'remark-code-title')
        return
      }

      if (!filename) return

      parent.children.splice(index, 1, {
        type: 'paragraph',
        children: [node],
        data: {
          hName: 'code-block',
          hProperties: {
            title: filename,
            lang: node.lang
          }
        }
      })
    })
  }
}

// Custom transformer to ensure empty lines have a space character
const transformerEmptyLineSpace: ShikiTransformer = {
  name: 'transformer-empty-line-space',
  line(node) {
    // Check if the line is empty (no children or only empty text nodes)
    const isEmpty =
      !node.children?.length ||
      node.children.every(
        child =>
          child.type === 'text' && (!child.value || child.value.trim() === '')
      )

    if (isEmpty) {
      // Set the line content to a single space
      node.children = [
        {
          type: 'text',
          value: ' '
        }
      ]
    }
  }
}

const docs = defineCollection({
  name: 'Docs',
  pattern: ['docs/**/*.mdx'],
  schema: s
    .object({
      title: s.string(),
      description: s.string().optional(),
      metadata: s.metadata(),
      llm: s
        .custom<string | undefined>(
          i => i === undefined || typeof i === 'string'
        )
        .transform((_data, { meta }) => {
          return (meta.content as string) ?? ''
        }),
      slug: s.path(),
      category: s.string().optional(),
      code: s.mdx(),
      toc: s.toc(),
      hideToc: s.boolean().optional()
    })
    .transform(data => ({
      ...data,
      toc: flattenToc(data.toc)
    }))
})

export default defineConfig({
  root: 'content',
  collections: {
    docs
  },
  mdx: {
    remarkPlugins: [remarkCodeTitle],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: 'append',
          properties: {
            className: ['subheading-anchor']
          }
        }
      ],
      [
        rehypeShiki,
        {
          transformers: [
            transformerNotationDiff(),
            transformerNotationFocus(),
            transformerNotationHighlight(),
            transformerNotationWordHighlight(),
            transformerMetaHighlight(),
            transformerMetaWordHighlight(),
            transformerEmptyLineSpace
          ],
          themes: {
            light: 'github-light',
            dark: 'github-dark'
          },
          defaultColor: false
        }
      ]
    ]
  }
})
