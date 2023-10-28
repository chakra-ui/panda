import { AstroLogo } from '@/icons/astro'
import { GatsbyLogo } from '@/icons/gatsby'
import { NextjsLogo } from '@/icons/nextjs'
import { NextjsAppLogo } from '@/icons/nextjs-app'
import { NextjsPagesLogo } from '@/icons/nextjs-pages'
import { NuxtLogo } from '@/icons/nuxt'
import { PreactLogo } from '@/icons/preact'
import { QwikLogo } from '@/icons/qwik'
import { RemixLogo } from '@/icons/remix'
import { SolidjsLogo } from '@/icons/solid'
import { StorybookLogo } from '@/icons/storybook'
import { SvelteLogo } from '@/icons/svelte'
import { ViteLogo } from '@/icons/vite'
import { css } from '@/styled-system/css'
import { circle, flex, grid, square } from '@/styled-system/patterns'
import Link from 'next/link'

const SANDBOX_URL = 'https://github.com/chakra-ui/panda/tree/main/sandbox/'

function getNextJSLogo(Logo: () => JSX.Element) {
  return () => (
    <>
      <NextjsLogo />
      <div
        className={circle({
          bg: { base: 'yellow.200', _dark: 'yellow.300' },
          color: 'black',
          p: '0.5',
          pos: 'absolute',
          bottom: '1',
          right: '1',
          size: '5'
        })}
      >
        <Logo />
      </div>
    </>
  )
}

const examples = [
  { id: 'astro', logo: AstroLogo },
  { id: 'gatsby-ts', logo: GatsbyLogo },
  { id: 'next-js-app', logo: getNextJSLogo(NextjsAppLogo) },
  { id: 'next-js-pages', logo: getNextJSLogo(NextjsPagesLogo) },
  { id: 'nuxt', logo: NuxtLogo },
  { id: 'preact-ts', logo: PreactLogo },
  { id: 'qwik-ts', logo: QwikLogo },
  { id: 'remix', logo: RemixLogo },
  { id: 'solid-ts', logo: SolidjsLogo },
  { id: 'storybook', logo: StorybookLogo },
  { id: 'svelte', logo: SvelteLogo },
  { id: 'vite-ts', logo: ViteLogo }
] as const

type Props = {
  example: (typeof examples)[number]
}

export const ExampleCard = (props: Props) => {
  const { example } = props

  const href = SANDBOX_URL + example.id

  return (
    <div
      className={flex({
        gap: '6',
        position: 'relative',
        align: 'center'
      })}
    >
      <div
        className={square({
          size: '14',
          layerStyle: 'offShadow',
          shadowColor: { _dark: 'neutral.700' },
          rounded: 'md',
          position: 'relative'
        })}
      >
        <example.logo />
      </div>
      <div>
        <h4 className={css({ fontWeight: 'medium' })}>
          <Link
            href={href}
            target="_blank"
            className={css({
              _before: {
                content: '""',
                position: 'absolute',
                inset: '0'
              }
            })}
          >
            {example.id}
          </Link>
        </h4>
      </div>
    </div>
  )
}

export const ExampleCards = () => {
  return (
    <div
      className={grid({
        columns: { base: 1, md: 3 },
        gap: '8',
        mt: '8',
        mb: '16'
      })}
    >
      {examples.map(example => (
        <ExampleCard key={example.id} example={example} />
      ))}
    </div>
  )
}
