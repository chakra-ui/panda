import assert from 'node:assert/strict'
import { test } from 'node:test'
import { maskFencedCode, nonDocLinkError } from '../docs-link-checks'

test('ignores links in fenced examples and preserves following source positions', () => {
  const source =
    '```tsx\n<a href="/post/1">Post</a>\n```\n[Missing](/docs/missing)'
  const masked = maskFencedCode(source)

  assert.equal(masked.length, source.length)
  assert.equal(masked.split('\n').length, source.split('\n').length)
  assert.equal(masked.indexOf('[Missing]'), source.indexOf('[Missing]'))
  assert.deepEqual([...masked.matchAll(/href="([^"]+)"/g)], [])
})

test('a shorter fence inside an example does not end the example', () => {
  const source =
    '````md\n```tsx\n<a href="/post/1" />\n```\n````\n[Docs](/docs/page)'
  assert.equal(maskFencedCode(source).trim(), '[Docs](/docs/page)')
})

test('supports tilde fences and masks an unclosed example', () => {
  assert.equal(maskFencedCode('~~~tsx\n<a href="/post/1" />\n~~~').trim(), '')
  assert.equal(maskFencedCode('```tsx\n<a href="/post/1" />').trim(), '')
})

test('keeps rendered Markdown and JSX links outside fences', () => {
  const source = '[Missing](/docs/missing)\n<a href="/wrong-route">Link</a>'
  assert.equal(maskFencedCode(source), source)
})

const blogHeadings = new Map([
  ['see-your-design-system', new Set(['view-your-tokens'])]
])

test('accepts existing blog routes, documentation routes, and assets', () => {
  for (const path of [
    '/blog',
    '/blog/see-your-design-system',
    '/docs/page',
    '/image.png'
  ]) {
    assert.equal(nonDocLinkError(path, undefined, blogHeadings), undefined)
  }
  assert.equal(
    nonDocLinkError(
      '/blog/see-your-design-system',
      '#view-your-tokens',
      blogHeadings
    ),
    undefined
  )
})

test('still rejects missing blog posts, missing headings, and unknown routes', () => {
  assert.deepEqual(
    [
      nonDocLinkError('/blog/missing', undefined, blogHeadings),
      nonDocLinkError('/blog/see-your-design-system', '#missing', blogHeadings),
      nonDocLinkError('/wrong-route', undefined, blogHeadings)
    ],
    [
      'no blog post at slug "missing"',
      'no heading "missing" in blog/see-your-design-system.mdx',
      'internal doc link must start with /docs/ (routes live under /docs)'
    ]
  )
})
