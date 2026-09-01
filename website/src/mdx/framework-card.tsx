import { AngularLogo } from '@/icons/angular'
import { AstroLogo } from '@/icons/astro'
import { EmberLogo } from '@/icons/ember'
import { GatsbyLogo } from '@/icons/gatsby'
import { NextjsLogo } from '@/icons/nextjs'
import { NuxtLogo } from '@/icons/nuxt'
import { PreactLogo } from '@/icons/preact'
import { ReactRouterLogo } from '@/icons/react-router'
import { QwikLogo } from '@/icons/qwik'
import { RedwoodLogo } from '@/icons/redwood'
import { RsbuildLogo } from '@/icons/rsbuild'
import { RemixLogo } from '@/icons/remix'
import { SolidjsLogo } from '@/icons/solid'
import { SvelteLogo } from '@/icons/svelte'
import { ViteLogo } from '@/icons/vite'
import { VueLogo } from '@/icons/vue'
import { css } from '@/styled-system/css'
import { grid, square, stack } from '@/styled-system/patterns'
import Link from 'next/link'

// Ordered most to least popular, so the framework grid surfaces common setups first.
const logoMap = {
  nextjs: {
    name: 'Next.js',
    href: '/docs/get-started/nextjs',
    logo: NextjsLogo
  },
  vite: {
    name: 'Vite',
    logo: ViteLogo,
    href: '/docs/get-started/vite'
  },
  astro: {
    name: 'Astro',
    logo: AstroLogo,
    href: '/docs/get-started/astro'
  },
  vue: {
    name: 'Vue',
    logo: VueLogo,
    href: '/docs/get-started/vue'
  },
  nuxt: {
    name: 'Nuxt',
    logo: NuxtLogo,
    href: '/docs/get-started/nuxt'
  },
  svelte: {
    name: 'Svelte',
    logo: SvelteLogo,
    href: '/docs/get-started/svelte'
  },
  remix: {
    name: 'Remix',
    logo: RemixLogo,
    href: '/docs/get-started/remix'
  },
  reactrouter: {
    name: 'React Router',
    logo: ReactRouterLogo,
    href: '/docs/get-started/react-router'
  },
  angular: {
    name: 'Angular',
    logo: AngularLogo,
    href: '/docs/get-started/angular'
  },
  gatsby: {
    name: 'Gatsby',
    logo: GatsbyLogo,
    href: '/docs/get-started/gatsby'
  },
  solid: {
    name: 'Solid',
    logo: SolidjsLogo,
    href: '/docs/get-started/solidjs'
  },
  qwik: {
    name: 'Qwik',
    logo: QwikLogo,
    href: '/docs/get-started/qwik'
  },
  preact: {
    name: 'Preact',
    logo: PreactLogo,
    href: '/docs/get-started/preact'
  },
  rsbuild: {
    name: 'Rsbuild',
    logo: RsbuildLogo,
    href: '/docs/get-started/rsbuild'
  },
  ember: {
    name: 'Ember',
    logo: EmberLogo,
    href: '/docs/get-started/ember'
  },
  redwood: {
    name: 'Redwood',
    logo: RedwoodLogo,
    href: '/docs/get-started/redwood'
  }
}

type Props = {
  framework: keyof typeof logoMap
}

export const FrameworkCard = (props: Props) => {
  const { framework } = props
  const { logo: Logo, name, href } = logoMap[framework] ?? {}
  return (
    <div
      className={stack({
        gap: '6',
        position: 'relative',
        direction: { base: 'column', sm: 'row' },
        align: { base: 'flex-start', sm: 'center' }
      })}
    >
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
