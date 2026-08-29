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
        source: '/docs/getting-started',
        destination: '/docs/styling/getting-started',
        permanent: true
      },
      {
        source: '/docs/styling/recipes',
        destination: '/docs/recipes/recipes',
        permanent: true
      },
      {
        source: '/docs/styling/slot-recipes',
        destination: '/docs/recipes/slot-recipes',
        permanent: true
      },
      {
        source: '/docs/styling/patterns',
        destination: '/docs/recipes/patterns',
        permanent: true
      },
      {
        source: '/docs/styling/jsx-style-context',
        destination: '/docs/recipes/jsx-style-context',
        permanent: true
      },
      {
        source: '/docs/styling/how-panda-works',
        destination: '/docs/compiler/how-panda-works',
        permanent: true
      },
      {
        source: '/docs/styling/compiler-engine',
        destination: '/docs/compiler/compiler-engine',
        permanent: true
      },
      {
        source: '/docs/styling/performance-optimization',
        destination: '/docs/compiler/performance-optimization',
        permanent: true
      },
      {
        source: '/docs/styling/cli',
        destination: '/docs/compiler/cli',
        permanent: true
      },
      {
        source: '/docs/styling/postcss',
        destination: '/docs/compiler/postcss',
        permanent: true
      },
      {
        source: '/docs/styling/storybook',
        destination: '/docs/compiler/storybook',
        permanent: true
      },
      {
        source: '/docs/styling/vite',
        destination: '/docs/compiler/vite',
        permanent: true
      },
      {
        source: '/docs/styling/angular',
        destination: '/docs/compiler/angular',
        permanent: true
      },
      {
        source: '/docs/styling/astro',
        destination: '/docs/compiler/astro',
        permanent: true
      },
      {
        source: '/docs/styling/ember',
        destination: '/docs/compiler/ember',
        permanent: true
      },
      {
        source: '/docs/styling/gatsby',
        destination: '/docs/compiler/gatsby',
        permanent: true
      },
      {
        source: '/docs/styling/nextjs',
        destination: '/docs/compiler/nextjs',
        permanent: true
      },
      {
        source: '/docs/styling/nuxt',
        destination: '/docs/compiler/nuxt',
        permanent: true
      },
      {
        source: '/docs/styling/preact',
        destination: '/docs/compiler/preact',
        permanent: true
      },
      {
        source: '/docs/styling/qwik',
        destination: '/docs/compiler/qwik',
        permanent: true
      },
      {
        source: '/docs/styling/react-router',
        destination: '/docs/compiler/react-router',
        permanent: true
      },
      {
        source: '/docs/styling/redwood',
        destination: '/docs/compiler/redwood',
        permanent: true
      },
      {
        source: '/docs/styling/remix',
        destination: '/docs/compiler/remix',
        permanent: true
      },
      {
        source: '/docs/styling/rsbuild',
        destination: '/docs/compiler/rsbuild',
        permanent: true
      },
      {
        source: '/docs/styling/solidjs',
        destination: '/docs/compiler/solidjs',
        permanent: true
      },
      {
        source: '/docs/styling/svelte',
        destination: '/docs/compiler/svelte',
        permanent: true
      },
      {
        source: '/docs/styling/vue',
        destination: '/docs/compiler/vue',
        permanent: true
      },
      {
        source: '/docs/design-systems/static',
        destination: '/docs/compiler/static',
        permanent: true
      },
      {
        source: '/docs/styling/llms-txt',
        destination: '/docs/tooling/llms-txt',
        permanent: true
      },
      {
        source: '/docs/styling/mcp-server',
        destination: '/docs/tooling/mcp-server',
        permanent: true
      },
      {
        source: '/docs/styling/agent-skills',
        destination: '/docs/tooling/agent-skills',
        permanent: true
      },
      {
        source: '/docs/reference/eslint-oxlint-plugin',
        destination: '/docs/tooling/eslint-oxlint-plugin',
        permanent: true
      },
      {
        source: '/docs/reference/editor-tooling',
        destination: '/docs/tooling/editor-tooling',
        permanent: true
      },
      {
        source: '/docs/theming/studio',
        destination: '/docs/tooling/studio',
        permanent: true
      },
      {
        source: '/docs/theming/studio-v2',
        destination: '/docs/tooling/studio-v2',
        permanent: true
      },
      // Bare tab roots: the [...slug] catch-all needs at least one page segment.
      {
        source: '/docs/recipes',
        destination: '/docs/recipes/overview',
        permanent: true
      },
      {
        source: '/docs/compiler',
        destination: '/docs/compiler/overview',
        permanent: true
      },
      {
        source: '/docs/tooling',
        destination: '/docs/tooling/overview',
        permanent: true
      },
      {
        source: '/docs/styling',
        destination: '/docs/styling/overview',
        permanent: true
      },
      {
        source: '/docs/theming',
        destination: '/docs/theming/overview',
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
