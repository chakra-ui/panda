export interface TeamMember {
  login: string
  role: string
  /** Advisors shaped the work Panda stands on, but don't maintain it today. */
  status: 'maintainer' | 'advisor'
}

export const teamMembers: TeamMember[] = [
  {
    login: 'segunadebayo',
    role: 'Creator & Lead Maintainer',
    status: 'maintainer'
  },
  { login: 'Adebesin-Cell', role: 'Maintainer', status: 'maintainer' },
  { login: 'anubra266', role: 'Creator, Tark UI', status: 'advisor' },
  { login: 'astahmer', role: 'Creator', status: 'advisor' },
  { login: 'cschroeter', role: 'Creator @ Park UI', status: 'advisor' },
  { login: 'estheragbaje', role: 'Developer Marketing', status: 'maintainer' }
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
 * Routes are `${tab.key}/${page.url}`; a group's own `url` is never routed, it
 * is only a sidebar label.
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
    key: 'get-started',
    title: 'Get Started',
    side: 'left',
    items: [
      {
        title: 'Overview',
        items: [
          { title: 'Welcome to Panda', href: '/docs' },
          { title: 'Why Panda', url: 'getting-started' },
          { title: 'Thinking in Panda', url: 'thinking-in-panda' },
          { title: 'FAQs', url: 'faq' },
          { title: 'Upgrading to v2', url: 'upgrading-to-v2' }
        ]
      },
      {
        title: 'Installation',
        items: [
          { title: 'CLI', url: 'cli' },
          { title: 'PostCSS', url: 'postcss' },
          { title: 'Framework Guides', url: 'framework-guides' },
          { title: 'Storybook', url: 'storybook' }
        ]
      },
      {
        title: 'AI for Agents',
        items: [
          { title: 'MCP Server', url: 'mcp-server' },
          { title: 'LLMs.txt', url: 'llms-txt' },
          { title: 'Agent Skills', url: 'agent-skills' }
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
      },
      {
        title: 'Tooling',
        items: [
          { title: 'ESLint Plugin', url: 'eslint-plugin' },
          { title: 'OXLint Plugin', url: 'oxlint-plugin' },
          { title: 'Source Transforms', url: 'source-transforms' },
          { title: 'Editor & IDE Tooling', url: 'editor-tooling' }
        ]
      },
      {
        title: 'Frameworks',
        items: [
          { title: 'Next.js', url: 'nextjs' },
          { title: 'Vite', url: 'vite' },
          { title: 'Astro', url: 'astro' },
          { title: 'Vue', url: 'vue' },
          { title: 'Nuxt', url: 'nuxt' },
          { title: 'Svelte', url: 'svelte' },
          { title: 'Remix', url: 'remix' },
          { title: 'React Router', url: 'react-router' },
          { title: 'Angular', url: 'angular' },
          { title: 'Gatsby', url: 'gatsby' },
          { title: 'SolidJS', url: 'solidjs' },
          { title: 'Qwik', url: 'qwik' },
          { title: 'Preact', url: 'preact' },
          { title: 'Rsbuild', url: 'rsbuild' },
          { title: 'Ember', url: 'ember' },
          { title: 'Redwood', url: 'redwood' }
        ]
      }
    ]
  },
  {
    key: 'styling',
    title: 'Styling',
    side: 'left',
    items: [
      {
        title: 'Write styles',
        items: [
          { title: 'Overview', url: 'overview' },
          { title: 'Writing Styles', url: 'writing-styles' },
          { title: 'Conditional Styles', url: 'conditional-styles' },
          { title: 'Responsive Design', url: 'responsive-design' },
          { title: 'Patterns', url: 'patterns' },
          { title: 'Merging Styles', url: 'merging-styles' }
        ]
      },
      {
        title: 'JSX',
        items: [
          { title: 'Style props', url: 'style-props' },
          { title: 'Factory props', url: 'factory-props' },
          { title: 'Extraction rules', url: 'extraction-rules' }
        ]
      },
      {
        title: 'Build & output',
        items: [
          { title: 'Dynamic Styles', url: 'dynamic-styling' },
          { title: 'Static CSS Generation', url: 'static' },
          { title: 'Optimization', url: 'optimization' }
        ]
      },
      {
        title: 'Advanced',
        items: [
          { title: 'Cascade Layers', url: 'cascade-layers' },
          { title: 'Global Styles', url: 'global-styles' },
          { title: 'Virtual Color', url: 'virtual-color' },
          { title: 'Color opacity modifier', url: 'color-opacity-modifier' },
          { title: 'View Transition', url: 'view-transition' }
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
        title: 'Write recipes',
        items: [
          { title: 'Overview', url: 'overview' },
          { title: 'Atomic Recipe', url: 'atomic-recipe' },
          { title: 'Slot Recipe', url: 'slot-recipes' },
          { title: 'Config Recipe', url: 'config-recipe' }
        ]
      },
      {
        title: 'Variants',
        items: [
          { title: 'Compound variants', url: 'compound-variants' },
          { title: 'Dynamic variants', url: 'dynamic-variants' },
          { title: 'Responsive variants', url: 'responsive-variants' }
        ]
      },
      {
        title: 'JSX Usage',
        items: [
          { title: 'Styled factory', url: 'styled-factory' },
          { title: 'Recipe context', url: 'recipe-context' },
          { title: 'Slot recipe context', url: 'slot-recipe-context' },
          { title: 'Tracking JSX', url: 'jsx-tracking' }
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
          { title: 'Spec', url: 'spec' }
        ]
      },
      {
        title: 'Customization',
        items: [
          { title: 'Utilities', url: 'utilities' },
          { title: 'Conditions', url: 'conditions' },
          { title: 'Patterns', url: 'patterns' },
          { title: 'Presets', url: 'presets' },
          { title: 'The extend keyword', url: 'extend' },
          { title: 'Hooks', url: 'hooks' },
          { title: 'Config Functions', url: 'config-functions' },
          { title: 'Ecosystem Plugins', url: 'ecosystem-plugins' }
        ]
      },
      {
        title: 'Studio',
        items: [
          { title: 'Panda Studio', url: 'studio' },
          { title: 'Panda Studio in v2', url: 'studio-v2' }
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
          { title: 'Set up a library package', url: 'setup' },
          { title: 'Wrap headless UI', url: 'wrap-headless-ui' },
          { title: 'forwardProps & the styled factory', url: 'forward-props' },
          { title: 'Isolated Declarations', url: 'isolated-declarations' },
          {
            title: 'Ship the styled-system vs the CSS',
            url: 'ship-styled-system'
          },
          { title: 'Track usage in wrapped components', url: 'track-usage' },
          { title: 'Troubleshooting', url: 'troubleshooting' }
        ]
      },
      {
        title: 'Design System Preset',
        items: [
          { title: 'Overview', url: 'preset-overview' },
          { title: 'Build a design system', url: 'building-a-design-system' },
          { title: 'Consume a design system', url: 'consuming-a-design-system' }
        ]
      },
      {
        title: 'Distribution & Scale',
        items: [
          {
            title: 'Shared styled-system in a monorepo',
            url: 'shared-styled-system'
          },
          { title: 'Publishing to npm', url: 'publishing-to-npm' },
          { title: 'Avoiding CSS collisions', url: 'avoiding-collisions' },
          { title: 'Monorepo dev workflow', url: 'monorepo-dev-workflow' },
          {
            title: 'Federated Micro-Frontends',
            url: 'federated-microfrontends'
          },
          { title: 'Minimal Setup', url: 'minimal-setup' },
          {
            title: 'Environment-specific config',
            url: 'environment-specific-config'
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
        title: 'Styled System',
        items: [
          { title: 'Overview', url: 'styled-system' },
          { title: 'css()', url: 'css' },
          { title: 'cva()', url: 'cva' },
          { title: 'sva()', url: 'sva' },
          { title: 'cx()', url: 'cx' },
          { title: 'viewTransition()', url: 'view-transition' },
          { title: 'patterns/', url: 'patterns' },
          { title: 'recipes/', url: 'recipes' },
          { title: 'jsx/', url: 'jsx' },
          { title: 'tokens/', url: 'tokens' },
          { title: 'types/', url: 'types' }
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

export function getTab(key: string): TabItem | undefined {
  return docsTabs.find(tab => tab.key === key)
}

/** Tabs that jump straight into content instead of an index page. */
const TAB_LANDING_HREF: Record<string, string> = {
  'get-started': '/docs',
  styling: '/docs/styling/overview',
  recipes: '/docs/recipes/overview',
  theming: '/docs/theming/tokens',
  'design-systems': '/docs/design-systems/setup'
}

/** Unlisted tabs fall back to the tab root, which redirects onward. */
export function tabLandingHref(tabKey: string): string {
  return TAB_LANDING_HREF[tabKey] ?? `/docs/${tabKey}`
}

export const defaultTabKey = 'get-started'

/**
 * Team and Showcase repeat the top-level nav on purpose, pending its rework.
 * GitHub is left out; it has a permanent icon link up there.
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
