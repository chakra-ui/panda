import { AstroLogo } from '@/icons/astro'
import { GatsbyLogo } from '@/icons/gatsby'
import { NextjsLogo } from '@/icons/nextjs'
import { PreactLogo } from '@/icons/preact'
import { QwikLogo } from '@/icons/qwik'
import { RedwoodLogo } from '@/icons/redwood'
import { RemixLogo } from '@/icons/remix'
import { SolidjsLogo } from '@/icons/solid'
import { StorybookLogo } from '@/icons/storybook'
import { SvelteLogo } from '@/icons/svelte'
import { ViteLogo } from '@/icons/vite'
import { css } from '@/styled-system/css'
import { grid, hstack, square } from '@/styled-system/patterns'
import Link from 'next/link'

const logoMap = {
  nextjs: {
    name: 'Next.js',
    description:
      'Next.js is a React framework for building full-stack Web applications.',
    href: '/docs/getting-started/nextjs',
    logo: NextjsLogo
  },
  gatsby: {
    name: 'Gatsby',
    logo: GatsbyLogo,
    href: '/docs/getting-started/gatsby',
    description:
      'Gatsby is a React-based open source framework for creating websites and apps.'
  },
  solid: {
    name: 'Solid',
    logo: SolidjsLogo,
    href: '/docs/getting-started/solidjs',
    description:
      'Solid is a declarative JavaScript library for creating user interfaces.'
  },
  vite: {
    name: 'Vite',
    logo: ViteLogo,
    href: '/docs/getting-started/vite',
    description: 'Vite is a fast build tool for modern web projects.'
  },
  preact: {
    name: 'Preact',
    logo: PreactLogo,
    href: '/docs/getting-started/preact',
    description:
      'Preact is a fast 3kB alternative to React with the same modern API.'
  },
  svelte: {
    name: 'Svelte',
    logo: SvelteLogo,
    href: '/docs/getting-started/svelte',
    description: 'Svelte is a radical new approach to building user interfaces.'
  },
  astro: {
    name: 'Astro',
    logo: AstroLogo,
    href: '/docs/getting-started/astro',
    description: 'The all-in-one web framework designed for speed.'
  },
  remix: {
    name: 'Remix',
    logo: RemixLogo,
    href: '/docs/getting-started/remix',
    description:
      'Remix is a React framework for building full-stack Web applications.'
  },
  qwik: {
    name: 'Qwik',
    logo: QwikLogo,
    href: '/docs/getting-started/qwik',
    description: 'Build instantly-interactive web apps without effort.'
  },
  redwood: {
    name: 'Redwood',
    logo: RedwoodLogo,
    href: '/docs/getting-started/redwood',
    description:
      'Redwood is a full-stack JavaScript framework for the JAMstack. It brings together the best of React and GraphQL, with conventions to make your life easier.'
  },
  storybook: {
    name: 'Storybook',
    logo: StorybookLogo,
    href: '/docs/getting-started/storybook',
    description:
      'Storybook is an open source tool for developing UI components in isolation for React, Vue, and Angular.'
  }
}

type Props = {
  framework: keyof typeof logoMap
}

export const FrameworkCard = (props: Props) => {
  const { framework } = props
  const { logo: Logo, name, href } = logoMap[framework] ?? {}
  return (
    <div className={hstack({ gap: '6', position: 'relative' })}>
      <div
        className={square({
          size: '14',
          layerStyle: 'offShadow',
          shadowColor: { _dark: 'neutral.700' },
          rounded: 'md'
        })}
      >
        <Logo />
      </div>
      <div>
        <h4 className={css({ fontWeight: 'medium' })}>
          <Link
            href={href}
            className={css({
              _before: {
                content: '""',
                position: 'absolute',
                inset: '0'
              }
            })}
          >
            {name}
          </Link>
        </h4>
      </div>
    </div>
  )
}

export const FrameworkCards = () => {
  return (
    <div className={grid({ columns: 3, gap: '8', mt: '8', mb: '16' })}>
      {Object.keys(logoMap).map(framework => (
        <FrameworkCard
          key={framework}
          framework={framework as keyof typeof logoMap}
        />
      ))}
    </div>
  )
}
