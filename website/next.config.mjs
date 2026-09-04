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
  /**
   * IMPORTANT: every `source` here must be a path that shipped on the v1
   * site (panda-css.com, `main` in chakra-ui/panda). Never add redirects for
   * v2-branch reshuffles: a page renamed or moved before v2 ships has no
   * inbound links to protect. Update the surviving page's links instead.
   */
  async redirects() {
    const to = (source, destination) => ({
      source,
      destination,
      permanent: true
    })

    return [
      // Carried over from the v1 site.
      to('/discord', 'https://discord.gg/VQrkpsgSx7'),
      to('/play', 'https://play.panda-css.com'),
      to('/learn', 'https://pandamastery.com'),
      to('/docs/getting-started', '/docs/get-started/getting-started'),

      // Tab roots. `tabLandingHref` in docs.config sends unlisted tabs here.
      to('/docs/get-started', '/docs/get-started/getting-started'),
      to('/docs/styling', '/docs/styling/overview'),
      to('/docs/recipes', '/docs/recipes/overview'),
      to('/docs/theming', '/docs/theming/tokens'),
      to('/docs/design-systems', '/docs/design-systems/overview'),
      to('/docs/reference', '/docs/reference/cli'),

      // v1 docs paths that no longer exist, grouped by their v1 section.
      // Exact rules come before the wildcards.
      to('/docs/overview/why-panda', '/docs/get-started/getting-started'),
      to('/docs/overview/getting-started', '/docs/get-started/getting-started'),
      to('/docs/overview/faq', '/docs/get-started/faq'),
      to(
        '/docs/overview/browser-support',
        '/docs/get-started/faq#browser-support'
      ),
      to('/docs/overview/llms-txt', '/docs/get-started/llms-txt'),

      to('/docs/ai/llms-txt', '/docs/get-started/llms-txt'),
      to('/docs/ai/mcp-server', '/docs/get-started/mcp-server'),

      to('/docs/concepts/styled-system', '/docs/reference/styled-system'),
      to('/docs/concepts/extend', '/docs/theming/extend'),
      to('/docs/concepts/hooks', '/docs/theming/plugins'),
      to('/docs/concepts/recipes', '/docs/recipes/overview'),
      to('/docs/concepts/slot-recipes', '/docs/recipes/slot-recipes'),
      to(
        '/docs/concepts/jsx-style-context',
        '/docs/recipes/slot-recipe-context'
      ),
      to(
        '/docs/concepts/template-literals',
        '/docs/get-started/styled-components'
      ),
      to(
        '/docs/concepts/atomic-styles',
        '/docs/styling/writing-styles#atomic-styles'
      ),
      to(
        '/docs/concepts/nested-styles',
        '/docs/styling/writing-styles#nested-styles'
      ),
      to(
        '/docs/concepts/important',
        '/docs/styling/writing-styles#important-styles'
      ),
      to('/docs/concepts/utility-first', '/docs/styling/writing-styles'),
      to('/docs/concepts/merge-styles', '/docs/styling/merging-styles'),
      to('/docs/concepts/creating-a-preset', '/docs/theming/presets'),
      to('/docs/concepts/custom-font', '/docs/theming/fonts'),

      to('/docs/customization/theme', '/docs/theming/theme'),
      to('/docs/customization/utilities', '/docs/theming/utilities'),
      to('/docs/customization/conditions', '/docs/theming/conditions'),
      to('/docs/customization/patterns', '/docs/theming/patterns'),
      to('/docs/customization/presets', '/docs/theming/presets'),
      to(
        '/docs/customization/config-functions',
        '/docs/reference/config-functions'
      ),
      to('/docs/customization/deprecations', '/docs/reference/deprecations'),

      to('/docs/theming/introduction', '/docs/theming/tokens'),
      to('/docs/theming/categories', '/docs/theming/tokens'),
      to('/docs/theming/token-types', '/docs/theming/tokens'),
      to('/docs/theming/consuming-tokens', '/docs/theming/usage'),
      to('/docs/theming/multi-theme', '/docs/theming/multiple-themes'),

      to('/docs/references/panda-config', '/docs/reference/config'),
      to('/docs/references/presets', '/docs/theming/presets'),

      to('/docs/guides/debugging', '/docs/reference/debugging'),
      to(
        '/docs/guides/environment-specific-config',
        '/docs/reference/config#hash'
      ),
      to('/docs/guides/dynamic-styling', '/docs/styling/dynamic-styling'),
      to('/docs/guides/static', '/docs/styling/static'),
      to('/docs/guides/virtual-color', '/docs/styling/virtual-color'),
      to(
        '/docs/guides/federated-microfrontends',
        '/docs/styling/style-isolation'
      ),
      to('/docs/guides/fonts', '/docs/theming/fonts'),
      to('/docs/guides/custom-font', '/docs/theming/fonts'),
      to('/docs/guides/multiple-themes', '/docs/theming/multiple-themes'),
      to('/docs/guides/minimal-setup', '/docs/theming/minimal-setup'),
      to('/docs/guides/preset', '/docs/theming/presets'),
      to('/docs/guides/component-library', '/docs/design-systems/overview'),
      to('/docs/guides/design-system', '/docs/design-systems/overview'),

      to(
        '/docs/migration/styled-components',
        '/docs/get-started/styled-components'
      ),

      to('/docs/installation/:path*', '/docs/get-started/:path*'),
      to('/docs/concepts/:path*', '/docs/styling/:path*'),
      to('/docs/references/:path*', '/docs/reference/:path*'),
      to('/docs/utilities/:path*', '/docs/reference/:path*')
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
