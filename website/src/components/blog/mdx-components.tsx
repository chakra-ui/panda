import { Callout } from '@/mdx/callout'
import { Card, Cards } from '@/mdx/cards'
import { CodeBlock } from '@/mdx/code-block'
import { Details, Faq } from '@/mdx/details'
import { Pre } from '@/mdx/pre'
import { Steps } from '@/mdx/steps'
import { Tab, Tabs } from '@/mdx/tabs'
import { css, cx } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'
import type { MDXComponents } from 'mdx/types'
import * as React from 'react'

const EXTERNAL_HREF = /^https?:\/\//

/** Plain anchor so the prose recipe styles it; external links open in a new tab. */
const BlogLink = ({ href = '', ...props }: React.ComponentProps<'a'>) => {
  const external = EXTERNAL_HREF.test(href)
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      {...props}
    />
  )
}

/** Components with their own styling opt out of prose without changing the docs versions. */
const notProse = <P extends object>(Component: React.ComponentType<P>) => {
  const Wrapped = (props: P) => (
    <div className={cx('not-prose', css({ display: 'contents' }))}>
      <Component {...props} />
    </div>
  )
  Wrapped.displayName = `NotProse(${Component.displayName ?? Component.name})`
  return Wrapped
}

/**
 * Blog posts are rendered by the `prose` recipe from `@pandacss/preset-typography`.
 * Only components that need to be components stay here; every plain element is
 * left to the recipe.
 */
export const blogMdxComponents: MDXComponents = {
  Box,
  Flex,

  a: BlogLink,
  pre: Pre,
  img: (props: React.ComponentProps<'img'>) => (
    <img alt="" {...props} className={css({ rounded: 'md' })} />
  ),

  'code-block': notProse(CodeBlock),
  Callout: notProse(Callout),
  Card,
  Cards: notProse(Cards),
  'card-group': notProse(Cards),
  Details: notProse(Details),
  details: notProse(Details),
  Faq: notProse(Faq),
  Steps: notProse(Steps),
  Tabs: notProse(Tabs),
  Tab,

  Video: (props: React.ComponentProps<'video'>) => (
    <video
      muted
      loop
      playsInline
      autoPlay
      {...props}
      className={css({ rounded: 'lg', bg: 'bg.muted' })}
    />
  )
}
