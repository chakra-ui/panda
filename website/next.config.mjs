/** @type {import('next').NextConfig} */
const config = {
  async rewrites() {
    return [
      {
        source: '/docs/:path*.mdx',
        destination: '/llms.txt/:path*.mdx'
      }
    ]
  },
  async redirects() {
    return [
      {
        source: '/(docs|docs/getting-started)',
        destination: '/docs/overview/getting-started',
        permanent: true
      },
      {
        source: '/discord',
        destination: 'https://discord.gg/VQrkpsgSx7',
        permanent: true
      },
      {
        source: '/play',
        destination: 'https://play.panda-css.com',
        permanent: true
      },
      {
        source: '/learn',
        destination: 'https://pandamastery.com',
        permanent: true
      }
    ]
  },
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { hostname: 'images.unsplash.com' },
      { hostname: 'avatars.githubusercontent.com' },
      { hostname: 'coolcontrast.vercel.app' },
      { hostname: 's2.coinmarketcap.com' },
      { hostname: 'novu.co' },
      { hostname: 'magic.link' },
      { hostname: 'ark-ui.com' }
    ]
  }
}

export default config
