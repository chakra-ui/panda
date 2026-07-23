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
      },
      {
        source: '/docs/overview/llms-txt',
        destination: '/docs/ai/llms-txt',
        permanent: true
      },
      {
        source: '/docs/concepts/hooks',
        destination: '/docs/customization/hooks',
        permanent: true
      },
      {
        source: '/docs/customization/theme',
        destination: '/docs/theming/theme',
        permanent: true
      },
      {
        source: '/docs/customization/deprecations',
        destination: '/docs/references/deprecations',
        permanent: true
      },
      {
        source: '/docs/guides/debugging',
        destination: '/docs/references/debugging',
        permanent: true
      },
      {
        source: '/docs/guides/dynamic-styling',
        destination: '/docs/concepts/dynamic-styling',
        permanent: true
      },
      {
        source: '/docs/guides/fonts',
        destination: '/docs/theming/fonts',
        permanent: true
      },
      {
        source: '/docs/guides/multiple-themes',
        destination: '/docs/theming/multiple-themes',
        permanent: true
      },
      {
        source: '/docs/guides/environment-specific-config',
        destination: '/docs/distribution/environment-specific-config',
        permanent: true
      },
      {
        source: '/docs/guides/federated-microfrontends',
        destination: '/docs/distribution/federated-microfrontends',
        permanent: true
      },
      {
        source: '/docs/guides/minimal-setup',
        destination: '/docs/distribution/minimal-setup',
        permanent: true
      },
      {
        source: '/docs/guides/static',
        destination: '/docs/distribution/static',
        permanent: true
      },
      {
        source: '/docs/guides/component-library',
        destination: '/docs/component-library/overview',
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
      { hostname: 'magic.link' },
      { hostname: 'ark-ui.com' }
    ]
  }
}

export default config
