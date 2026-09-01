import { createMDX } from 'fumadocs-mdx/next'

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
    // Only v1 panda-css.com paths that no longer exist. No redirects for
    // v2-branch IA reshuffles (renames, tab moves that never shipped on v1).
    return [
      {
        source: '/guides',
        destination: '/docs/get-started/framework-guides',
        permanent: true
      },
      {
        source: '/ecosystem',
        destination: '/docs',
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
        source: '/docs/getting-started',
        destination: '/docs/get-started/getting-started',
        permanent: true
      },
      {
        source: '/docs/styling/template-literals',
        destination: '/docs/get-started/styled-components',
        permanent: true
      },

      // Bare tab roots: the [...slug] catch-all needs at least one page segment.
      {
        source: '/docs/get-started',
        destination: '/docs/get-started/getting-started',
        permanent: true
      },
      {
        source: '/docs/styling',
        destination: '/docs/styling/overview',
        permanent: true
      },
      {
        source: '/docs/recipes',
        destination: '/docs/recipes/atomic-recipe',
        permanent: true
      },
      {
        source: '/docs/theming',
        destination: '/docs/theming/tokens',
        permanent: true
      },
      {
        source: '/docs/design-systems',
        destination: '/docs/design-systems/setup',
        permanent: true
      },
      {
        source: '/docs/reference',
        destination: '/docs/reference/cli',
        permanent: true
      },

      // Specific v1 paths that don't land on the right page via the directory
      // wildcards below. These MUST come before the wildcards.
      {
        source: '/docs/overview/why-panda',
        destination: '/docs/get-started/getting-started',
        permanent: true
      },
      {
        source: '/docs/overview/getting-started',
        destination: '/docs/get-started/getting-started',
        permanent: true
      },
      {
        source: '/docs/overview/faq',
        destination: '/docs/get-started/faq',
        permanent: true
      },
      {
        source: '/docs/overview/browser-support',
        destination: '/docs/get-started/faq#browser-support',
        permanent: true
      },
      {
        source: '/docs/overview/llms-txt',
        destination: '/docs/get-started/llms-txt',
        permanent: true
      },
      {
        source: '/docs/concepts/styled-system',
        destination: '/docs/reference/styled-system',
        permanent: true
      },
      {
        source: '/docs/concepts/extend',
        destination: '/docs/theming/extend',
        permanent: true
      },
      {
        source: '/docs/concepts/hooks',
        destination: '/docs/theming/hooks',
        permanent: true
      },
      {
        source: '/docs/concepts/recipes',
        destination: '/docs/recipes/atomic-recipe',
        permanent: true
      },
      {
        source: '/docs/concepts/slot-recipes',
        destination: '/docs/recipes/slot-recipes',
        permanent: true
      },
      {
        source: '/docs/concepts/jsx-style-context',
        destination: '/docs/recipes/jsx-recipes-overview',
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
        source: '/docs/customization/utilities',
        destination: '/docs/theming/utilities',
        permanent: true
      },
      {
        source: '/docs/customization/conditions',
        destination: '/docs/theming/conditions',
        permanent: true
      },
      {
        source: '/docs/customization/patterns',
        destination: '/docs/theming/patterns',
        permanent: true
      },
      {
        source: '/docs/customization/presets',
        destination: '/docs/theming/presets',
        permanent: true
      },
      {
        source: '/docs/customization/hooks',
        destination: '/docs/theming/hooks',
        permanent: true
      },
      {
        source: '/docs/customization/config-functions',
        destination: '/docs/theming/config-functions',
        permanent: true
      },
      {
        source: '/docs/customization/ecosystem-plugins',
        destination: '/docs/theming/ecosystem-plugins',
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
        destination: '/docs/styling/static',
        permanent: true
      },
      {
        source: '/docs/guides/component-library',
        destination: '/docs/design-systems/setup',
        permanent: true
      },
      {
        source: '/docs/installation/cli',
        destination: '/docs/get-started/cli',
        permanent: true
      },
      {
        source: '/docs/installation/postcss',
        destination: '/docs/get-started/postcss',
        permanent: true
      },
      {
        source: '/docs/installation/storybook',
        destination: '/docs/get-started/storybook',
        permanent: true
      },
      {
        source: '/docs/installation/vite',
        destination: '/docs/get-started/vite',
        permanent: true
      },
      {
        source: '/docs/installation/angular',
        destination: '/docs/get-started/angular',
        permanent: true
      },
      {
        source: '/docs/installation/astro',
        destination: '/docs/get-started/astro',
        permanent: true
      },
      {
        source: '/docs/installation/ember',
        destination: '/docs/get-started/ember',
        permanent: true
      },
      {
        source: '/docs/installation/gatsby',
        destination: '/docs/get-started/gatsby',
        permanent: true
      },
      {
        source: '/docs/installation/nextjs',
        destination: '/docs/get-started/nextjs',
        permanent: true
      },
      {
        source: '/docs/installation/nuxt',
        destination: '/docs/get-started/nuxt',
        permanent: true
      },
      {
        source: '/docs/installation/preact',
        destination: '/docs/get-started/preact',
        permanent: true
      },
      {
        source: '/docs/installation/qwik',
        destination: '/docs/get-started/qwik',
        permanent: true
      },
      {
        source: '/docs/installation/react-router',
        destination: '/docs/get-started/react-router',
        permanent: true
      },
      {
        source: '/docs/installation/redwood',
        destination: '/docs/get-started/redwood',
        permanent: true
      },
      {
        source: '/docs/installation/remix',
        destination: '/docs/get-started/remix',
        permanent: true
      },
      {
        source: '/docs/installation/rsbuild',
        destination: '/docs/get-started/rsbuild',
        permanent: true
      },
      {
        source: '/docs/installation/solidjs',
        destination: '/docs/get-started/solidjs',
        permanent: true
      },
      {
        source: '/docs/installation/svelte',
        destination: '/docs/get-started/svelte',
        permanent: true
      },
      {
        source: '/docs/installation/vue',
        destination: '/docs/get-started/vue',
        permanent: true
      },
      {
        source: '/docs/ai/llms-txt',
        destination: '/docs/get-started/llms-txt',
        permanent: true
      },
      {
        source: '/docs/ai/mcp-server',
        destination: '/docs/get-started/mcp-server',
        permanent: true
      },

      // Directory wildcards: v1 tabs that moved uniformly (same basename).
      {
        source: '/docs/overview/:path*',
        destination: '/docs/styling/:path*',
        permanent: true
      },
      {
        source: '/docs/concepts/:path*',
        destination: '/docs/styling/:path*',
        permanent: true
      },
      {
        source: '/docs/component-library/:path*',
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
      }
    ]
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
