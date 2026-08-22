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
        destination: '/docs/styling/getting-started',
        permanent: true
      },
      // Bare tab roots: the [...slug] catch-all needs at least one page segment.
      {
        source: '/docs/styling',
        destination: '/docs/styling/getting-started',
        permanent: true
      },
      {
        source: '/docs/theming',
        destination: '/docs/theming/tokens',
        permanent: true
      },
      {
        source: '/docs/design-systems',
        destination: '/docs/design-systems/overview',
        permanent: true
      },
      {
        source: '/docs/reference',
        destination: '/docs/reference/cli',
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
        destination: '/docs/styling/llms-txt',
        permanent: true
      },

      // --- Phase 2: tab-directory flattening. Specific overrides MUST come
      // before the wildcard rules below, since a handful of pages moved to a
      // different tab than the rest of their old directory. ---
      {
        source: '/docs/concepts/hooks',
        destination: '/docs/design-systems/hooks',
        permanent: true
      },
      {
        source: '/docs/customization/theme',
        destination: '/docs/theming/theme',
        permanent: true
      },
      {
        source: '/docs/customization/deprecations',
        destination: '/docs/reference/deprecations',
        permanent: true
      },
      {
        source: '/docs/guides/debugging',
        destination: '/docs/reference/debugging',
        permanent: true
      },
      {
        source: '/docs/guides/dynamic-styling',
        destination: '/docs/styling/dynamic-styling',
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
        destination: '/docs/design-systems/environment-specific-config',
        permanent: true
      },
      {
        source: '/docs/guides/federated-microfrontends',
        destination: '/docs/design-systems/federated-microfrontends',
        permanent: true
      },
      {
        source: '/docs/guides/minimal-setup',
        destination: '/docs/design-systems/minimal-setup',
        permanent: true
      },
      {
        source: '/docs/guides/static',
        destination: '/docs/design-systems/static',
        permanent: true
      },
      {
        source: '/docs/guides/component-library',
        destination: '/docs/design-systems/overview',
        permanent: true
      },

      // --- directory-level wildcards: everything else in these old
      // directories moved uniformly to the same new tab, same basename ---
      {
        source: '/docs/overview/:path*',
        destination: '/docs/styling/:path*',
        permanent: true
      },
      {
        source: '/docs/ai/:path*',
        destination: '/docs/styling/:path*',
        permanent: true
      },
      {
        source: '/docs/installation/:path*',
        destination: '/docs/styling/:path*',
        permanent: true
      },
      {
        source: '/docs/concepts/:path*',
        destination: '/docs/styling/:path*',
        permanent: true
      },
      {
        source: '/docs/migration/:path*',
        destination: '/docs/styling/:path*',
        permanent: true
      },
      {
        source: '/docs/component-library/:path*',
        destination: '/docs/design-systems/:path*',
        permanent: true
      },
      {
        source: '/docs/customization/:path*',
        destination: '/docs/design-systems/:path*',
        permanent: true
      },
      {
        source: '/docs/distribution/:path*',
        destination: '/docs/design-systems/:path*',
        permanent: true
      },
      {
        source: '/docs/utilities/:path*',
        destination: '/docs/reference/:path*',
        permanent: true
      },
      {
        source: '/docs/references/:path*',
        destination: '/docs/reference/:path*',
        permanent: true
      },
      {
        source: '/docs/styling/why-panda',
        destination: '/docs/styling/getting-started',
        permanent: true
      },
      {
        source: '/docs/styling/isolated-declarations',
        destination: '/docs/design-systems/isolated-declarations',
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
