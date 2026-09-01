import { Sidebar } from '@/components/docs/sidebar'
import { defaultTabKey } from '@/docs.config'
import { css, cx } from '@/styled-system/css'
import { generateOgImageUrl } from '@/lib/og-image'
import { Card, Cards } from '@/mdx/cards'
import { Box, Stack } from '@/styled-system/jsx'
import type { Metadata } from 'next'
import {
  LuBlocks,
  LuDownload,
  LuLayers,
  LuPaintbrush,
  LuPalette,
  LuZap
} from 'react-icons/lu'

const title = 'Welcome to Panda'
const description =
  'Build modern websites with build-time, type-safe CSS-in-JS.'

export const metadata: Metadata = {
  title: title,
  description,
  openGraph: {
    title,
    description,
    type: 'article',
    images: [generateOgImageUrl({ title, description, category: 'Docs' })]
  }
}

const sidebarScroll = css({
  maskImage:
    'linear-gradient(to bottom, black calc(100% - 2.5rem), transparent 100%)'
})

export default function DocsWelcomePage() {
  return (
    <Box display="flex" position="relative">
      <Box
        as="aside"
        display={{ base: 'none', lg: 'block' }}
        flexShrink="0"
        w="290px"
        position="sticky"
        top="calc(var(--navbar-height) + var(--banner-height) + var(--tabbar-height))"
        height="calc(100vh - var(--navbar-height) - var(--banner-height) - var(--tabbar-height))"
      >
        <Box
          overflowY="auto"
          height="100%"
          className={cx('scroll-area', sidebarScroll)}
          pt="10"
          pb="4"
          px="6"
        >
          <Sidebar tabKey={defaultTabKey} />
        </Box>
      </Box>

      <Box as="article" flex="1" minW="0" maxW="64rem" mx="auto" px="6" pt="10" pb="16">
      <Box textStyle="eyebrow" color="fg.subtle" mb="4">
        Docs
      </Box>

      <Stack gap="3" mb="10">
        <Box
          as="h1"
          fontSize="4xl"
          fontWeight="bold"
          letterSpacing="tight"
          lineHeight="1.1"
        >
          {title}
        </Box>
        <Box textStyle="lg" color="fg.muted" maxW="42rem" lineHeight="1.6">
          Panda is a styling engine that generates atomic CSS from the styles
          you write, at build time, with no runtime cost.
        </Box>
      </Stack>

      <Cards columns={2}>
        <Card
          icon={<LuPaintbrush />}
          title="Styling"
          href="/docs/styling/writing-styles"
          description="css(), style props, conditions and the styled factory."
          cta="Write a style"
        />
        <Card
          icon={<LuLayers />}
          title="Recipes"
          href="/docs/recipes/atomic-recipe"
          description="Component styles with variants, compiled at build time."
          cta="Write a recipe"
        />
        <Card
          icon={<LuPalette />}
          title="Theming"
          href="/docs/theming/tokens"
          description="Design tokens, semantic tokens and multiple themes."
          cta="Define tokens"
        />
        <Card
          icon={<LuBlocks />}
          title="Design Systems"
          href="/docs/design-systems/setup"
          description="Presets, component libraries and shipping to npm."
          cta="Build a system"
        />
      </Cards>

      <Box borderTopWidth="1px" borderColor="border" my="14" />

      <Box
        as="h2"
        fontSize="3xl"
        fontWeight="semibold"
        letterSpacing="tight"
        mb="3"
      >
        Get started
      </Box>
      <Box textStyle="prose" color="fg.muted" maxW="42rem">
        Panda runs through the CLI, PostCSS, or your bundler, and generates a
        typed <code>styled-system</code> directory you import from. New to
        Panda?
      </Box>

      <Cards columns={2}>
        <Card
          icon={<LuDownload />}
          title="Install Panda"
          href="/docs/get-started/cli"
          description="Every install path, for every framework."
        />
        <Card
          icon={<LuZap />}
          title="Thinking in Panda"
          href="/docs/get-started/thinking-in-panda"
          description="The mental model, in about ten minutes."
        />
      </Cards>
      </Box>
    </Box>
  )
}
