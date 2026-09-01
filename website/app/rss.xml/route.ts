import { blog } from '.velite'
import { docsConfig } from '@/docs.config'

export const dynamic = 'force-static'

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function GET() {
  const site = docsConfig.url
  const posts = [...blog].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const items = posts
    .map(post => {
      const slug = post.slug.split('/').slice(1).join('/')
      const url = `${site}/blog/${slug}`
      return [
        '    <item>',
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <pubDate>${new Date(post.date).toUTCString()}</pubDate>`,
        post.description
          ? `      <description>${escapeXml(post.description)}</description>`
          : '',
        ...(post.author ?? []).map(
          name => `      <dc:creator>${escapeXml(name)}</dc:creator>`
        ),
        ...(post.tags ?? []).map(
          tag => `      <category>${escapeXml(tag)}</category>`
        ),
        '    </item>'
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n')

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(docsConfig.title)} Blog</title>
    <link>${site}/blog</link>
    <description>News, updates, and deep dives from the Panda CSS team</description>
    <language>en</language>
    <lastBuildDate>${new Date(posts[0]?.date ?? Date.now()).toUTCString()}</lastBuildDate>
    <atom:link href="${site}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`

  return new Response(feed, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  })
}
