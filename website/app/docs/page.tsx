import { Card, Cards } from '@/mdx/cards'
import { generateOgImageUrl } from '@/lib/og-image'
import { Box, Stack } from '@/styled-system/jsx'
import type { Metadata } from 'next'
import {
  LuBlocks,
  LuCog,
  LuDownload,
  LuLayers,
  LuPaintbrush,
  LuPalette,
  LuWrench,
  LuZap
} from 'react-icons/lu'

const title = 'Welcome to Panda'
const description =
  'Build modern websites with build-time, type-safe CSS-in-JS.'

export const metadata: Metadata = {
  title: `${title} | Panda CSS`,
  description,
  openGraph: {
    title,
    description,
    type: 'article',
    images: [generateOgImageUrl({ title, description, category: 'Docs' })]
  }
}

export default function DocsWelcomePage() {
  return (
    <Box as="article" maxW="60rem" mx="auto" px="6" pt="10">
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

      <Cards columns={3}>
        <Card
          icon={<LuPaintbrush />}
          title="Styling"
          href="/docs/styling/overview"
          description="css(), style props, conditions and the styled factory."
          cta="Write a style"
        />
        <Card
          icon={<LuLayers />}
          title="Recipes"
          href="/docs/recipes/overview"
          description="Component styles with variants, compiled at build time."
          cta="Write a recipe"
        />
        <Card
          icon={<LuPalette />}
          title="Theming"
          href="/docs/theming/overview"
          description="Design tokens, semantic tokens and multiple themes."
          cta="Define tokens"
        />
        <Card
          icon={<LuBlocks />}
          title="Design Systems"
          href="/docs/design-systems/overview"
          description="Presets, component libraries and shipping to npm."
          cta="Build a system"
        />
        <Card
          icon={<LuCog />}
          title="Compiler"
          href="/docs/compiler/overview"
          description="Extraction, CSS emission and every build integration."
          cta="See the pipeline"
        />
        <Card
          icon={<LuWrench />}
          title="Tooling"
          href="/docs/tooling/overview"
          description="Lint rules, editor support and surfaces agents read."
          cta="Set up tooling"
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
          href="/docs/styling/installation"
          description="Every install path, for every framework."
        />
        <Card
          icon={<LuZap />}
          title="Thinking in Panda"
          href="/docs/styling/thinking-in-panda"
          description="The mental model, in about ten minutes."
        />
      </Cards>
    </Box>
  )
}
