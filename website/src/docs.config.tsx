import { css } from '@/styled-system/css'
import { Icon } from '@/theme/icons'

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
  items?: NavItem[]
}

export interface DocsConfig {
  title: string
  description: string
  url: string
  docsRepositoryBase: string
  gitTimestamp: string
  logoUrl?: string
  logo: React.ReactNode
  footer: React.ReactNode
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
  logo: <Icon icon="LogoWithText" />,
  footer: (
    <div
      className={css({
        display: 'flex',
        justifyContent: 'space-between',
        gap: '4',
        width: '100%',
        fontSize: 'sm'
      })}
    >
      <span>Copyright © {new Date().getFullYear()}</span>
      <a
        className={css({ color: 'current', textDecoration: 'none' })}
        href="https://www.adebayosegun.com/"
      >
        Proudly made by the Chakra team
      </a>
    </div>
  ),
  navigation: [
    {
      title: 'Docs',
      type: 'page',
      href: '/docs'
    },
    {
      title: 'Team',
      type: 'page',
      href: '/team'
    },
    {
      title: 'Playground',
      type: 'page',
      href: 'https://play.panda-css.com/',
      external: true,
      newWindow: true
    },
    {
      title: 'Learn',
      type: 'page',
      href: '/learn'
    }
  ]
}

export const docsNavigation: NavItem = {
  title: 'Docs',
  url: 'docs',
  items: [
    {
      title: 'Overview',
      url: 'overview',
      items: [
        { title: 'Getting Started', url: 'getting-started' },
        { title: 'Why Panda?', url: 'why-panda' },
        { title: 'FAQs', url: 'faq' },
        { title: 'Browser Support', url: 'browser-support' },
        {
          title: 'Roadmap',
          href: 'https://panda-css.canny.io/',
          external: true
        },
        {
          title: 'Changelog',
          href: 'https://github.com/chakra-ui/panda/blob/main/CHANGELOG.md',
          external: true
        }
      ]
    },
    {
      title: 'Installation',
      url: 'installation',
      items: [
        { title: 'CLI', url: 'cli' },
        { title: 'PostCSS', url: 'postcss' },
        { title: 'Astro', url: 'astro' },
        { title: 'Angular', url: 'angular' },
        { title: 'Next.js', url: 'nextjs' },
        { title: 'Remix', url: 'remix' },
        { title: 'React Router', url: 'react-router' },
        { title: 'Gatsby', url: 'gatsby' },
        { title: 'Ember', url: 'ember' },
        { title: 'Redwood', url: 'redwood' },
        { title: 'Rsbuild', url: 'rsbuild' },
        { title: 'Qwik', url: 'qwik' },
        { title: 'Vite', url: 'vite' },
        { title: 'Vue', url: 'vue' },
        { title: 'Nuxt', url: 'nuxt' },
        { title: 'Preact', url: 'preact' },
        { title: 'Solid.js', url: 'solidjs' },
        { title: 'Svelte', url: 'svelte' },
        { title: 'Storybook', url: 'storybook' }
      ]
    },
    {
      title: 'Concepts',
      url: 'concepts',
      items: [
        { title: 'Cascade Layers', url: 'cascade-layers' },
        { title: 'Writing Styles', url: 'writing-styles' },
        { title: 'Merging Styles', url: 'merging-styles' },
        { title: 'Template Literals', url: 'template-literals' },
        { title: 'Conditional Styles', url: 'conditional-styles' },
        { title: 'Responsive Design', url: 'responsive-design' },
        { title: 'Virtual Color', url: 'virtual-color' },
        { title: 'Patterns', url: 'patterns' },
        { title: 'Recipes', url: 'recipes' },
        { title: 'Slot Recipes', url: 'slot-recipes' },
        { title: 'JSX Style Props', url: 'style-props' },
        { title: 'JSX Style Context', url: 'jsx-style-context' },
        { title: 'Color opacity modifier', url: 'color-opacity-modifier' },
        { title: 'Hooks', url: 'hooks' },
        { title: 'Styled System', url: 'styled-system' },
        { title: 'The extend keyword', url: 'extend' }
      ]
    },
    {
      title: 'Migration',
      url: 'migration',
      items: [
        { title: 'Stitches', url: 'stitches' },
        { title: 'Styled Components', url: 'styled-components' },
        { title: 'Theme UI', url: 'theme-ui' }
      ]
    },
    {
      title: 'Theming',
      url: 'theming',
      items: [
        { title: 'Tokens', url: 'tokens' },
        { title: 'Token Usage', url: 'usage' },
        { title: 'Text Styles', url: 'text-styles' },
        { title: 'Layer Styles', url: 'layer-styles' },
        { title: 'Animation Styles', url: 'animation-styles' }
      ]
    },
    {
      title: 'Customization',
      url: 'customization',
      items: [
        { title: 'Patterns', url: 'patterns' },
        { title: 'Conditions', url: 'conditions' },
        { title: 'Utilities', url: 'utilities' },
        { title: 'Presets', url: 'presets' },
        { title: 'Theme', url: 'theme' },
        { title: 'Config Functions', url: 'config-functions' }
      ]
    },
    {
      title: 'Utilities',
      url: 'utilities',
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
    },
    {
      title: 'Guides',
      url: 'guides',
      items: [
        { title: 'Minimal Setup', url: 'minimal-setup' },
        { title: 'Component Library', url: 'component-library' },
        { title: 'Multiple Themes', url: 'multiple-themes' },
        { title: 'Custom Fonts', url: 'fonts' },
        { title: 'Dynamic Styles', url: 'dynamic-styling' },
        { title: 'Static Generator', url: 'static' },
        { title: 'Debugging', url: 'debugging' }
      ]
    },
    {
      title: 'References',
      url: 'references',
      items: [
        { title: 'CLI', url: 'cli' },
        { title: 'Config', url: 'config' }
      ]
    }
  ]
}
