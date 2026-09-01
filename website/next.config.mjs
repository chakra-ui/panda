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
    return [
      {
        source: '/docs/styling/template-literals',
        destination: '/docs/styling/styled-components',
        permanent: true
      },
      {
        source: '/docs/getting-started',
        destination: '/docs/get-started/getting-started',
        permanent: true
      },
      {
        source: '/docs/styling/recipes',
        destination: '/docs/recipes/atomic-recipe',
        permanent: true
      },
      {
        source: '/docs/styling/slot-recipes',
        destination: '/docs/recipes/slot-recipes',
        permanent: true
      },
      {
        source: '/docs/styling/jsx-style-context',
        destination: '/docs/recipes/jsx-recipes-overview',
        permanent: true
      },
      {
        source: '/docs/styling/how-panda-works',
        destination: '/docs/styling/how-panda-works',
        permanent: true
      },
      {
        source: '/docs/styling/compiler-engine',
        destination: '/docs/styling/compiler-engine',
        permanent: true
      },
      {
        source: '/docs/styling/performance-optimization',
        destination: '/docs/styling/performance-optimization',
        permanent: true
      },
      {
        source: '/docs/styling/cli',
        destination: '/docs/get-started/cli',
        permanent: true
      },
      {
        source: '/docs/styling/postcss',
        destination: '/docs/get-started/postcss',
        permanent: true
      },
      {
        source: '/docs/styling/storybook',
        destination: '/docs/get-started/storybook',
        permanent: true
      },
      {
        source: '/docs/styling/vite',
        destination: '/docs/get-started/vite',
        permanent: true
      },
      {
        source: '/docs/styling/angular',
        destination: '/docs/get-started/angular',
        permanent: true
      },
      {
        source: '/docs/styling/astro',
        destination: '/docs/get-started/astro',
        permanent: true
      },
      {
        source: '/docs/styling/ember',
        destination: '/docs/get-started/ember',
        permanent: true
      },
      {
        source: '/docs/styling/gatsby',
        destination: '/docs/get-started/gatsby',
        permanent: true
      },
      {
        source: '/docs/styling/nextjs',
        destination: '/docs/get-started/nextjs',
        permanent: true
      },
      {
        source: '/docs/styling/nuxt',
        destination: '/docs/get-started/nuxt',
        permanent: true
      },
      {
        source: '/docs/styling/preact',
        destination: '/docs/get-started/preact',
        permanent: true
      },
      {
        source: '/docs/styling/qwik',
        destination: '/docs/get-started/qwik',
        permanent: true
      },
      {
        source: '/docs/styling/react-router',
        destination: '/docs/get-started/react-router',
        permanent: true
      },
      {
        source: '/docs/styling/redwood',
        destination: '/docs/get-started/redwood',
        permanent: true
      },
      {
        source: '/docs/styling/remix',
        destination: '/docs/get-started/remix',
        permanent: true
      },
      {
        source: '/docs/styling/rsbuild',
        destination: '/docs/get-started/rsbuild',
        permanent: true
      },
      {
        source: '/docs/styling/solidjs',
        destination: '/docs/get-started/solidjs',
        permanent: true
      },
      {
        source: '/docs/styling/svelte',
        destination: '/docs/get-started/svelte',
        permanent: true
      },
      {
        source: '/docs/styling/vue',
        destination: '/docs/get-started/vue',
        permanent: true
      },
      {
        source: '/docs/design-systems/static',
        destination: '/docs/styling/static',
        permanent: true
      },
      {
        source: '/docs/styling/llms-txt',
        destination: '/docs/get-started/llms-txt',
        permanent: true
      },
      {
        source: '/docs/styling/mcp-server',
        destination: '/docs/get-started/mcp-server',
        permanent: true
      },
      {
        source: '/docs/styling/agent-skills',
        destination: '/docs/get-started/agent-skills',
        permanent: true
      },
      {
        source: '/docs/reference/eslint-oxlint-plugin',
        destination: '/docs/get-started/eslint-plugin',
        permanent: true
      },
      {
        source: '/docs/tooling/llms-txt',
        destination: '/docs/get-started/llms-txt',
        permanent: true
      },
      {
        source: '/docs/tooling/mcp-server',
        destination: '/docs/get-started/mcp-server',
        permanent: true
      },
      {
        source: '/docs/tooling/agent-skills',
        destination: '/docs/get-started/agent-skills',
        permanent: true
      },
      {
        source: '/docs/tooling/eslint-oxlint-plugin',
        destination: '/docs/get-started/eslint-plugin',
        permanent: true
      },
      {
        source: '/docs/reference/editor-tooling',
        destination: '/docs/get-started/editor-tooling',
        permanent: true
      },
      {
        source: '/docs/theming/studio',
        destination: '/docs/theming/studio',
        permanent: true
      },
      {
        source: '/docs/theming/studio-v2',
        destination: '/docs/theming/studio-v2',
        permanent: true
      },
      // Bare tab roots: the [...slug] catch-all needs at least one page segment.
      {
        source: '/docs/recipes',
        destination: '/docs/recipes/atomic-recipe',
        permanent: true
      },
      {
        source: '/docs/compiler',
        destination: '/docs/get-started/framework-guides',
        permanent: true
      },
      {
        source: '/docs/tooling',
        destination: '/docs/get-started',
        permanent: true
      },
      {
        source: '/docs/styling',
        destination: '/docs/styling/writing-styles',
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
        destination: '/docs/get-started/llms-txt',
        permanent: true
      },

      // --- Phase 2: tab-directory flattening. Specific overrides MUST come
      // before the wildcard rules below, since a handful of pages moved to a
      // different tab than the rest of their old directory. ---
      {
        source: '/docs/concepts/hooks',
        destination: '/docs/theming/hooks',
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
        destination: '/docs/design-systems/setup',
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
      },

      // --- Get Started tab split off from Styling (this pages' Core Concepts
      // and Styling APIs groups stayed put) ---
      {
        source: '/docs/styling/getting-started',
        destination: '/docs/get-started/getting-started',
        permanent: true
      },
      {
        source: '/docs/styling/installation',
        destination: '/docs/get-started/cli',
        permanent: true
      },
      {
        source: '/docs/styling/thinking-in-panda',
        destination: '/docs/get-started/thinking-in-panda',
        permanent: true
      },
      {
        source: '/docs/styling/faq',
        destination: '/docs/get-started/faq',
        permanent: true
      },
      {
        source: '/docs/styling/browser-support',
        destination: '/docs/get-started/browser-support',
        permanent: true
      },
      {
        source: '/docs/styling/upgrading-to-v2',
        destination: '/docs/get-started/upgrading-to-v2',
        permanent: true
      },
      {
        source: '/docs/styling/migration-strategy',
        destination: '/docs/get-started/migration-strategy',
        permanent: true
      },
      {
        source: '/docs/styling/tailwind',
        destination: '/docs/get-started/tailwind',
        permanent: true
      },
      {
        source: '/docs/styling/chakra-ui',
        destination: '/docs/get-started/chakra-ui',
        permanent: true
      },
      {
        source: '/docs/styling/stitches',
        destination: '/docs/get-started/stitches',
        permanent: true
      },
      {
        source: '/docs/styling/styled-components',
        destination: '/docs/get-started/styled-components',
        permanent: true
      },
      {
        source: '/docs/styling/emotion',
        destination: '/docs/get-started/emotion',
        permanent: true
      },
      {
        source: '/docs/styling/theme-ui',
        destination: '/docs/get-started/theme-ui',
        permanent: true
      },
      {
        source: '/docs/styling/stylex',
        destination: '/docs/get-started/stylex',
        permanent: true
      },
      {
        source: '/docs/get-started',
        destination: '/docs/get-started/getting-started',
        permanent: true
      },

      // --- Recipes tab rework: Recipes split into Atomic/Config, Patterns
      // moved to Styling, JSX Style Context split into JSX Recipes + Guides ---
      {
        source: '/docs/recipes/recipes',
        destination: '/docs/recipes/atomic-recipe',
        permanent: true
      },
      {
        source: '/docs/recipes/patterns',
        destination: '/docs/styling/patterns',
        permanent: true
      },
      {
        source: '/docs/recipes/jsx-style-context',
        destination: '/docs/recipes/jsx-recipes-overview',
        permanent: true
      },

      // --- Theming tab: overview page removed, tab lands on Tokens directly ---
      {
        source: '/docs/theming/overview',
        destination: '/docs/theming/tokens',
        permanent: true
      },

      // --- Design Systems: Customization group moved to Theming ---
      {
        source: '/docs/design-systems/utilities',
        destination: '/docs/theming/utilities',
        permanent: true
      },
      {
        source: '/docs/design-systems/conditions',
        destination: '/docs/theming/conditions',
        permanent: true
      },
      {
        source: '/docs/design-systems/patterns',
        destination: '/docs/theming/patterns',
        permanent: true
      },
      {
        source: '/docs/design-systems/presets',
        destination: '/docs/theming/presets',
        permanent: true
      },
      {
        source: '/docs/design-systems/hooks',
        destination: '/docs/theming/hooks',
        permanent: true
      },
      {
        source: '/docs/design-systems/config-functions',
        destination: '/docs/theming/config-functions',
        permanent: true
      },
      {
        source: '/docs/design-systems/ecosystem-plugins',
        destination: '/docs/theming/ecosystem-plugins',
        permanent: true
      },

      // --- Compiler and Tooling tabs removed entirely; content redistributed
      // to Get Started (installation content + frameworks + tooling),
      // Styling (compiler internals), and Theming (Studio) ---
      {
        source: '/docs/compiler/cli',
        destination: '/docs/get-started/cli',
        permanent: true
      },
      {
        source: '/docs/compiler/postcss',
        destination: '/docs/get-started/postcss',
        permanent: true
      },
      {
        source: '/docs/compiler/storybook',
        destination: '/docs/get-started/storybook',
        permanent: true
      },
      {
        source: '/docs/compiler/vite',
        destination: '/docs/get-started/vite',
        permanent: true
      },
      {
        source: '/docs/compiler/nextjs',
        destination: '/docs/get-started/nextjs',
        permanent: true
      },
      {
        source: '/docs/compiler/astro',
        destination: '/docs/get-started/astro',
        permanent: true
      },
      {
        source: '/docs/compiler/vue',
        destination: '/docs/get-started/vue',
        permanent: true
      },
      {
        source: '/docs/compiler/nuxt',
        destination: '/docs/get-started/nuxt',
        permanent: true
      },
      {
        source: '/docs/compiler/svelte',
        destination: '/docs/get-started/svelte',
        permanent: true
      },
      {
        source: '/docs/compiler/solidjs',
        destination: '/docs/get-started/solidjs',
        permanent: true
      },
      {
        source: '/docs/compiler/remix',
        destination: '/docs/get-started/remix',
        permanent: true
      },
      {
        source: '/docs/compiler/react-router',
        destination: '/docs/get-started/react-router',
        permanent: true
      },
      {
        source: '/docs/compiler/angular',
        destination: '/docs/get-started/angular',
        permanent: true
      },
      {
        source: '/docs/compiler/preact',
        destination: '/docs/get-started/preact',
        permanent: true
      },
      {
        source: '/docs/compiler/qwik',
        destination: '/docs/get-started/qwik',
        permanent: true
      },
      {
        source: '/docs/compiler/ember',
        destination: '/docs/get-started/ember',
        permanent: true
      },
      {
        source: '/docs/compiler/gatsby',
        destination: '/docs/get-started/gatsby',
        permanent: true
      },
      {
        source: '/docs/compiler/redwood',
        destination: '/docs/get-started/redwood',
        permanent: true
      },
      {
        source: '/docs/compiler/rsbuild',
        destination: '/docs/get-started/rsbuild',
        permanent: true
      },
      {
        source: '/docs/compiler/transformer',
        destination: '/docs/get-started/source-transforms',
        permanent: true
      },
      {
        source: '/docs/compiler/overview',
        destination: '/docs/get-started/framework-guides',
        permanent: true
      },
      {
        source: '/docs/compiler/how-panda-works',
        destination: '/docs/styling/how-panda-works',
        permanent: true
      },
      {
        source: '/docs/compiler/compiler-engine',
        destination: '/docs/styling/compiler-engine',
        permanent: true
      },
      {
        source: '/docs/compiler/performance-optimization',
        destination: '/docs/styling/performance-optimization',
        permanent: true
      },
      {
        source: '/docs/compiler/static',
        destination: '/docs/styling/static',
        permanent: true
      },
      {
        source: '/docs/tooling/editor-tooling',
        destination: '/docs/get-started/editor-tooling',
        permanent: true
      },
      {
        source: '/docs/tooling/feedback',
        destination: '/docs/get-started/feedback',
        permanent: true
      },
      {
        source: '/docs/tooling/studio',
        destination: '/docs/theming/studio',
        permanent: true
      },
      {
        source: '/docs/tooling/studio-v2',
        destination: '/docs/theming/studio-v2',
        permanent: true
      },
      {
        source: '/docs/get-started/eslint-oxlint-plugin',
        destination: '/docs/get-started/eslint-plugin',
        permanent: true
      },

      // --- Overview pages removed: Installation, Styling, Recipes, and
      // Design Systems now land straight on their first real page ---
      {
        source: '/docs/get-started/installation',
        destination: '/docs/get-started/cli',
        permanent: true
      },
      {
        source: '/docs/styling/overview',
        destination: '/docs/styling/writing-styles',
        permanent: true
      },
      {
        source: '/docs/recipes/overview',
        destination: '/docs/recipes/atomic-recipe',
        permanent: true
      },
      {
        source: '/docs/design-systems/overview',
        destination: '/docs/design-systems/setup',
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
