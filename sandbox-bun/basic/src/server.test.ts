import { expect, test } from 'bun:test'
import index from './index.html'

test('the dev server serves the page with Panda CSS appended to the stylesheet', async () => {
  const server = Bun.serve({ routes: { '/': index }, development: true, port: 0 })
  try {
    const html = await (await fetch(`${server.url}`)).text()
    const href = html.match(/href="([^"]+\.css)"/)?.[1]
    expect(href).toBeDefined()

    const css = await (await fetch(new URL(href!, server.url))).text()
    expect(css).toContain('.bg_brand\\.50')
    expect(css).toContain('.badge--tone_brand')
    expect(css).toContain('--colors-brand-500')
  } finally {
    server.stop(true)
  }
})
