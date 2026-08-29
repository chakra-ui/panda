export interface TeamMember {
  login: string
  role: string
}

export const teamMembers: TeamMember[] = [
  { login: 'segunadebayo', role: 'Creator & Maintainer' },
  { login: 'astahmer', role: 'Creator' },
  { login: 'cschroeter', role: 'Creator @ Park UI' },
  { login: 'anubra266', role: 'Creator @ Tark UI' },
  { login: 'estheragbaje', role: 'Developer Marketing' }
]

export interface NavItem {
  title: string
  url?: string
  href?: string
  external?: boolean
  status?: 'new' | 'beta'
  type?: 'page'
  newWindow?: boolean
  tag?: string
  items?: NavItem[]
}

/**
 * A top-level tab in the docs shell (Styling / Theming / Design Systems / Reference).
 * `items` is a flat list of groups; each group's own `items` are pages. Only the
 * page's `url` contributes to the route: it's `${tab.key}/${page.url}`, since
 * Phase 2 flattened content so every page sits directly under its tab's content
 * directory (no group-level subdirectory). A group's `url` is unused for routing,
 * it exists purely as a sidebar label.
 */
export interface TabItem {
  key: string
  title: string
  side: 'left' | 'right'
  items: NavItem[]
}

export interface DocsConfig {
  title: string
  description: string
  url: string
  docsRepositoryBase: string
  gitTimestamp: string
  logoUrl?: string
  navigation: NavItem[]

  twitterUrl: string
  discordUrl: string
}

export const docsConfig: DocsConfig = {
  title: 'Panda CSS',
  description: 'Build modern websites using build-time and type-safe CSS-in-JS',
  url: 'https://panda-css.com',
  logoUrl: '/',
  docsRepositoryBase: 'https://github.com/chakra-ui/panda',
  gitTimestamp: 'Last updated on',
  twitterUrl: 'https://twitter.com/panda__css',
  discordUrl: 'https://discord.gg/VQrkpsgSx7',
  navigation: [
    {
      title: 'Docs',
      type: 'page',
      href: '/docs'
    },
    {
      title: 'Blog',
      type: 'page',
      href: '/blog'
    },
    {
      title: 'Team',
      type: 'page',
      href: '/team'
    },
    {
      title: 'Showcase',
      type: 'page',
      href: '/showcase'
    },
    {
      title: 'Playground',
      type: 'page',
      href: 'https://play.panda-css.com/',
      external: true,
      newWindow: true
    }
  ]
}

export const docsTabs: TabItem[] = [
  {
    key: 'styling',
    title: 'Styling',
    side: 'left',
    items: [
      {
        title: 'Get Started',
        items: [
          { title: 'Welcome to Panda', href: '/docs' },
          { title: 'Styling overview', url: 'overview' },
          { title: 'Why Panda', url: 'getting-started' },
          { title: 'Installation', url: 'installation' },
          { title: 'Thinking in Panda', url: 'thinking-in-panda' },
          { title: 'FAQs', url: 'faq' },
          { title: 'Browser Support', url: 'browser-support' },
          { title: 'Upgrading to v2', url: 'upgrading-to-v2' }
        ]
      },
      {
        title: 'Core Concepts',
        items: [
          { title: 'Writing Styles', url: 'writing-styles' },
          { title: 'Conditional Styles', url: 'conditional-styles' },
          { title: 'Responsive Design', url: 'responsive-design' },
          { title: 'Merging Styles', url: 'merging-styles' },
          { title: 'Global Styles', url: 'global-styles' },
          { title: 'Cascade Layers', url: 'cascade-layers' },
          { title: 'Dynamic Styles', url: 'dynamic-styling' },
          { title: 'Virtual Color', url: 'virtual-color' },
          { title: 'Color opacity modifier', url: 'color-opacity-modifier' }
        ]
      },
      {
        title: 'Styling APIs',
        items: [
          { title: 'JSX Style Props', url: 'style-props' },
          { title: 'Styled System', url: 'styled-system' },
          { title: 'The extend keyword', url: 'extend' },
          { title: 'Template Literals', url: 'template-literals' },
          { title: 'View Transition', url: 'view-transition', tag: 'new' }
        ]
      },
      {
        title: 'Migration',
        items: [
          { title: 'Migration strategy', url: 'migration-strategy' },
          { title: 'Tailwind CSS', url: 'tailwind' },
          { title: 'Chakra UI', url: 'chakra-ui' },
          { title: 'Stitches', url: 'stitches' },
          { title: 'Styled Components', url: 'styled-components' },
          { title: 'Emotion', url: 'emotion' },
          { title: 'Theme UI', url: 'theme-ui' },
          { title: 'StyleX', url: 'stylex' }
        ]
      }
    ]
  },
  {
    key: 'recipes',
    title: 'Recipes',
    side: 'left',
    items: [
      {
        title: 'Recipes',
        items: [
          { title: 'Overview', url: 'overview' },
          { title: 'Recipes', url: 'recipes' },
          { title: 'Slot Recipes', url: 'slot-recipes' }
        ]
      },
      {
        title: 'Composition',
        items: [
          { title: 'Patterns', url: 'patterns' },
          { title: 'JSX Style Context', url: 'jsx-style-context' }
        ]
      }
    ]
  },
  {
    key: 'theming',
    title: 'Theming',
    side: 'left',
    items: [
      {
        title: 'Tokens',
        items: [
          { title: 'Overview', url: 'overview' },
          { title: 'Tokens', url: 'tokens' },
          { title: 'Token Usage', url: 'usage' }
        ]
      },
      {
        title: 'Composite Styles',
        items: [
          { title: 'Text Styles', url: 'text-styles' },
          { title: 'Layer Styles', url: 'layer-styles' },
          { title: 'Animation Styles', url: 'animation-styles' }
        ]
      },
      {
        title: 'Themes',
        items: [
          { title: 'Theme', url: 'theme' },
          { title: 'Custom Fonts', url: 'fonts' },
          { title: 'Multiple Themes', url: 'multiple-themes' },
          { title: 'Spec', url: 'spec', tag: 'new' }
        ]
      }
    ]
  },
  {
    key: 'design-systems',
    title: 'Design Systems',
    side: 'left',
    items: [
      {
        title: 'Component Library',
        items: [
          { title: 'Overview', url: 'overview' },
          { title: 'Set up a library package', url: 'setup' },
          { title: 'Wrap headless UI', url: 'wrap-headless-ui' },
          { title: 'forwardProps & the styled factory', url: 'forward-props' },
          { title: 'Isolated Declarations', url: 'isolated-declarations' },
          { title: 'Ship the styled-system vs the CSS', url: 'ship-styled-system' },
          { title: 'Track usage in wrapped components', url: 'track-usage' },
          { title: 'Troubleshooting', url: 'troubleshooting' }
        ]
      },
      {
        title: 'Design System (preset)',
        items: [
          { title: 'Overview', url: 'preset-overview' },
          { title: 'Build a design system', url: 'building-a-design-system' },
          { title: 'Consume a design system', url: 'consuming-a-design-system' }
        ]
      },
      {
        title: 'Customization',
        items: [
          { title: 'Utilities', url: 'utilities' },
          { title: 'Conditions', url: 'conditions' },
          { title: 'Patterns', url: 'patterns' },
          { title: 'Presets', url: 'presets' },
          { title: 'Hooks', url: 'hooks' },
          { title: 'Config Functions', url: 'config-functions' },
          { title: 'Ecosystem Plugins', url: 'ecosystem-plugins' }
        ]
      },
      {
        title: 'Distribution & Scale',
        items: [
          { title: 'Shared styled-system in a monorepo', url: 'shared-styled-system' },
          { title: 'Publishing to npm', url: 'publishing-to-npm' },
          { title: 'Avoiding CSS collisions', url: 'avoiding-collisions' },
          { title: 'Monorepo dev workflow', url: 'monorepo-dev-workflow' },
          { title: 'Federated Micro-Frontends', url: 'federated-microfrontends' },
          { title: 'Minimal Setup', url: 'minimal-setup' },
          { title: 'Environment-specific config', url: 'environment-specific-config' }
        ]
      }
    ]
  },
  {
    key: 'compiler',
    title: 'Compiler',
    side: 'left',
    items: [
      {
        title: 'How it works',
        items: [
          { title: 'Overview', url: 'overview' },
          { title: 'How Panda works', url: 'how-panda-works' },
          { title: 'The Compiler Engine', url: 'compiler-engine' },
          { title: 'Performance & Optimization', url: 'performance-optimization' },
          { title: 'Static CSS Generation', url: 'static' }
        ]
      },
      {
        title: 'Build Integrations',
        items: [
          { title: 'CLI', url: 'cli' },
          { title: 'PostCSS', url: 'postcss' },
          { title: 'Vite', url: 'vite' },
          { title: 'Storybook', url: 'storybook' }
        ]
      },
      {
        title: 'Framework Guides',
        items: [
          { title: 'Next.js', url: 'nextjs' },
          { title: 'Astro', url: 'astro' },
          { title: 'Vue', url: 'vue' },
          { title: 'Nuxt', url: 'nuxt' },
          { title: 'Svelte', url: 'svelte' },
          { title: 'SolidJS', url: 'solidjs' },
          { title: 'Remix', url: 'remix' },
          { title: 'React Router', url: 'react-router' },
          { title: 'Angular', url: 'angular' },
          { title: 'Preact', url: 'preact' },
          { title: 'Qwik', url: 'qwik' },
          { title: 'Ember', url: 'ember' },
          { title: 'Gatsby', url: 'gatsby' },
          { title: 'Redwood', url: 'redwood' },
          { title: 'Rsbuild', url: 'rsbuild' }
        ]
      }
    ]
  },
  {
    key: 'tooling',
    title: 'Tooling',
    side: 'left',
    items: [
      {
        title: 'Lint & Edit',
        items: [
          { title: 'Overview', url: 'overview' },
          { title: 'ESLint & OXLint Plugin', url: 'eslint-oxlint-plugin' },
          { title: 'Editor & IDE Tooling', url: 'editor-tooling' }
        ]
      },
      {
        title: 'AI for Agents',
        tag: 'new',
        items: [
          { title: 'MCP Server', url: 'mcp-server' },
          { title: 'LLMs.txt', url: 'llms-txt' },
          { title: 'Agent Skills', url: 'agent-skills' }
        ]
      },
      {
        title: 'Inspect',
        items: [
          { title: 'Panda Studio', url: 'studio' },
          { title: 'Panda Studio in v2', url: 'studio-v2' },
          {
            title: 'Playground',
            href: 'https://play.panda-css.com/',
            external: true
          }
        ]
      }
    ]
  },
  {
    key: 'reference',
    title: 'Reference',
    side: 'right',
    items: [
      {
        title: 'CLI & Config',
        items: [
          { title: 'CLI', url: 'cli' },
          { title: 'Config', url: 'config' },
          { title: 'Debugging', url: 'debugging' },
          { title: 'Diagnostics', url: 'diagnostics' },
          { title: 'Deprecations', url: 'deprecations' }
        ]
      },
      {
        title: 'Utility Reference',
        items: [
          { title: 'Background', url: 'background' },
          { title: 'Border', url: 'border' },
          { title: 'Display', url: 'display' },
          { title: 'Divide', url: 'divide' },
          { title: 'Effects', url: 'effects' },
          { title: 'Flex and Grid', url: 'flex-and-grid' },
          { title: 'Gradients', url: 'gradients' },
          { title: 'Helpers', url: 'helpers' },
          { title: 'Interactivity', url: 'interactivity' },
          { title: 'Layout', url: 'layout' },
          { title: 'List', url: 'list' },
          { title: 'Masks', url: 'masks' },
          { title: 'Outline', url: 'outline' },
          { title: 'Focus Ring', url: 'focus-ring' },
          { title: 'Sizing', url: 'sizing' },
          { title: 'Spacing', url: 'spacing' },
          { title: 'SVG', url: 'svg' },
          { title: 'Tables', url: 'tables' },
          { title: 'Transforms', url: 'transforms' },
          { title: 'Transitions', url: 'transitions' },
          { title: 'Typography', url: 'typography' }
        ]
      }
    ]
  }
]

/** Look up a tab by its URL key (the first `/docs/:key` segment). */
export function getTab(key: string): TabItem | undefined {
  return docsTabs.find(tab => tab.key === key)
}

export const defaultTabKey = 'styling'

/**
 * Links shown in the TabBar's "Community" dropdown. Team and Showcase also
 * exist in the persistent top-level site nav today, that's expected to be
 * reworked/scrapped later, so they stay here deliberately rather than being
 * treated as a duplicate to remove. GitHub is left out since it's a permanent
 * icon link in the top nav with no plan to change that. Roadmap and Changelog
 * live in Styling ▸ Get Started instead, they're product tracking, not
 * community.
 */
export const communityLinks: NavItem[] = [
  { title: 'Team', href: '/team' },
  { title: 'Showcase', href: '/showcase' },
  {
    title: 'Contributing',
    href: 'https://github.com/chakra-ui/panda/blob/main/CONTRIBUTING.md',
    external: true
  },
  { title: 'Discord', href: docsConfig.discordUrl, external: true }
]
