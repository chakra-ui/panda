import { InstallPicker } from '@/components/install/install-picker'
import { SitePage } from '@/components/site-page'
import { generateOgImageUrl } from '@/lib/og-image'
import { Card, Cards } from '@/mdx/cards'
import { Box } from '@/styled-system/jsx'
import type { Metadata } from 'next'
import pandaPkg from '@pandacss/dev/package.json'

const title = 'Install Panda'
const description =
  'One command. Your typed styled-system generated in seconds.'

export const metadata: Metadata = {
  title: `${title} | Panda CSS`,
  description,
  openGraph: {
    title,
    description,
    images: [generateOgImageUrl({ title, description, category: 'Install' })]
  }
}

export default function InstallPage() {
  return (
    <SitePage
      kicker={`Install · v${pandaPkg.version}`}
      title={title}
      description={description}
      centered
    >
      <InstallPicker />

      <Box borderTopWidth="1px" borderColor="border" my="16" />

      <Box
        as="h2"
        fontSize="3xl"
        fontWeight="bold"
        letterSpacing="tight"
        mb="6"
      >
        Then, build something
      </Box>

      <Cards columns={3}>
        <Card
          kicker="New project"
          title="Start something new"
          href="/docs/get-started/getting-started"
          description="Set up Panda from scratch and write your first style."
          cta="Quickstart"
        />
        <Card
          kicker="Existing app"
          title="Add Panda to your app"
          href="/docs/get-started/cli"
          description="Drop Panda into a project that already has styles."
          cta="Setup guide"
        />
        <Card
          kicker="Migrating"
          title="Coming from Tailwind"
          href="/docs/get-started/tailwind"
          description="Map utility classes onto Panda's style objects."
          cta="Migration guide"
        />
      </Cards>

      <Box
        as="h2"
        fontSize="3xl"
        fontWeight="bold"
        letterSpacing="tight"
        mt="16"
        mb="6"
      >
        Learn
      </Box>

      <Cards columns={4} mode="gapless">
        <Card
          title="Documentation"
          href="/docs"
          description="Concepts, recipes, theming and design systems."
        />
        <Card
          title="Reference"
          href="/docs/reference/cli"
          description="Every utility, config option and CLI flag."
        />
        <Card
          title="Ecosystem"
          href="/ecosystem"
          description="Lint rules, editor support and presets."
        />
        <Card
          title="Discord"
          href="https://discord.gg/VQrkpsgSx7"
          description="Ask questions and hang out with the community."
        />
      </Cards>
    </SitePage>
  )
}
