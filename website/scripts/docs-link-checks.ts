/** Hide fenced examples while preserving source offsets and line numbers. */
export function maskFencedCode(content: string): string {
  let fence: string | undefined

  return content
    .split('\n')
    .map(line => {
      const marker = line.match(/^\s*(`{3,}|~{3,})(.*)$/)
      const inFence = fence !== undefined

      if (!fence && marker) {
        fence = marker[1]
      } else if (
        fence &&
        marker &&
        marker[1][0] === fence[0] &&
        marker[1].length >= fence.length &&
        marker[2].trim() === ''
      ) {
        fence = undefined
      }

      return inFence || fence ? line.replace(/./g, ' ') : line
    })
    .join('\n')
}

/** Validate rendered links to site routes outside the documentation tree. */
export function nonDocLinkError(
  path: string,
  fragment: string | undefined,
  blogHeadings: ReadonlyMap<string, ReadonlySet<string>>
): string | undefined {
  if (path.startsWith('/docs/')) return undefined
  if (/\.(png|jpe?g|gif|svg|webp|txt)$/.test(path)) return undefined
  if (path === '/blog' || path === '/blog/') return undefined

  if (path.startsWith('/blog/')) {
    const slug = path.slice('/blog/'.length).replace(/\/$/, '')
    const headings = blogHeadings.get(slug)

    if (!headings) return `no blog post at slug "${slug}"`
    if (fragment && !headings.has(fragment.slice(1))) {
      return `no heading "${fragment.slice(1)}" in blog/${slug}.mdx`
    }

    return undefined
  }

  return 'internal doc link must start with /docs/ (routes live under /docs)'
}
