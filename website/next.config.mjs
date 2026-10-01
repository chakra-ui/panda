import { readFileSync } from 'node:fs'
import { createMDX } from 'fumadocs-mdx/next'
import { redirects } from './redirects.mjs'

const pandaPackage = new URL('../packages/dev/package.json', import.meta.url)
const pandaVersion = JSON.parse(readFileSync(pandaPackage, 'utf8')).version

/** @type {import('next').NextConfig} */
const config = {
  async rewrites() {
    return [
      {
        source: '/docs/:path*.mdx',
        destination: '/llms.txt/:path*'
      }
    ]
  },
  async redirects() {
    return redirects
  },
  env: {
    NEXT_PUBLIC_PANDA_VERSION: pandaVersion
  },
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { hostname: 'images.unsplash.com' },
      { hostname: 'avatars.githubusercontent.com' },
      { hostname: 'github.com' },
      { hostname: 'coolcontrast.vercel.app' },
      { hostname: 's2.coinmarketcap.com' },
      { hostname: 'magic.link' },
      { hostname: 'ark-ui.com' }
    ]
  }
}

const withMDX = createMDX({
  macro: { include: ['**/src/lib/source.ts'] }
})

export default withMDX(config)
