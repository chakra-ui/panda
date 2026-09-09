import rehypeShiki from '@shikijs/rehype'
import {
  transformerMetaHighlight,
  transformerMetaWordHighlight,
  transformerNotationDiff,
  transformerNotationFocus,
  transformerNotationHighlight,
  transformerNotationWordHighlight
} from '@shikijs/transformers'
import { defineConfig } from 'fumadocs-mdx/config'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import type { ShikiTransformer } from 'shiki'
import { visit } from 'unist-util-visit'

/** Lifts ```ts filename="x.ts" fences into a titled <code-block> wrapper. */
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

export default defineConfig({
  mdxOptions: {
    // We run our own Shiki pass below, and neither of the other two default
    // plugins matches how this site authors content.
    rehypeCodeOptions: false,
    remarkImageOptions: false,
    remarkNpmOptions: false,
    remarkCodeTabOptions: false,
    // Appended, so `remarkStructure` (search index) sees plain code nodes and
    // skips them instead of indexing every snippet.
    remarkPlugins: v => [...v, remarkCodeTitle],
    // `v` ends with fumadocs' `rehypeToc`; the anchor is appended after it so
    // heading links don't leak into table-of-contents titles.
    rehypePlugins: v => [
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
            light: 'github-light-high-contrast',
            dark: 'github-dark'
          },
          defaultColor: false
        }
      ],
      ...v,
      [
        rehypeAutolinkHeadings,
        {
          behavior: 'append',
          properties: {
            className: ['subheading-anchor'],
            'aria-label': 'Link to this section'
          }
        }
      ]
    ]
  }
})
