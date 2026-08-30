import { SitePage } from '@/components/site-page'
import { generateOgImageUrl } from '@/lib/og-image'
import { Card, Cards } from '@/mdx/cards'
import { Box } from '@/styled-system/jsx'
import type { Metadata } from 'next'
import { LuBot, LuCode, LuShieldCheck } from 'react-icons/lu'

const title = 'Everything around Panda'
const description =
  'Lint, edit and generate with the rest of your toolchain.'

export const metadata: Metadata = {
  title: 'Ecosystem | Panda CSS',
  description,
  openGraph: {
    title,
    description,
    images: [
      generateOgImageUrl({ title, description, category: 'Ecosystem' })
    ]
  }
}

function Section(props: { title: string; children: React.ReactNode }) {
  return (
    <Box mt="14">
      <Box textStyle="eyebrow" color="fg.subtle" mb="4">
        {props.title}
      </Box>
      {props.children}
    </Box>
  )
}

export default function EcosystemPage() {
  return (
    <SitePage kicker="Ecosystem" title={title} description={description}>
      <Cards columns={2}>
        <Card
          icon={<LuShieldCheck />}
          kicker="Lint"
          title="ESLint plugin"
          href="/docs/get-started/eslint-oxlint-plugin"
          description="A shared rule set that catches the mistakes the compiler does not error on."
          cta="Set up linting"
        />
        <Card
          icon={<LuCode />}
          kicker="Edit"
          title="Editor & IDE"
          href="/docs/tooling/editor-tooling"
          description="Token previews, autocomplete and the TypeScript plugin."
          cta="Set up your editor"
        />
      </Cards>

      <Section title="For agents">
        <Cards columns={3} mode="gapless">
          <Card
            icon={<LuBot />}
            title="MCP server"
            href="/docs/get-started/mcp-server"
            description="Give an agent your real config, not a guess."
          />
          <Card
            title="llms.txt"
            href="/docs/get-started/llms-txt"
            description="These docs as plain text, per page or whole."
          />
          <Card
            title="Agent skills"
            href="/docs/get-started/agent-skills"
            description="Packaged instructions for coding agents."
          />
        </Cards>
      </Section>

      <Section title="Inspect">
        <Cards columns={3} mode="gapless">
          <Card
            title="Panda Studio"
            href="/docs/tooling/studio"
            description="A generated site for your design tokens."
          />
          <Card
            title="Playground"
            href="https://play.panda-css.com/"
            description="Try Panda in the browser, no install."
          />
          <Card
            title="Debugging"
            href="/docs/reference/debugging"
            description="See exactly what Panda extracted and why."
          />
        </Cards>
      </Section>

      <Section title="Presets">
        <Cards columns={2} mode="gapless">
          <Card
            title="preset-panda"
            href="/docs/theming/presets"
            description="The default tokens, conditions and utilities."
          />
          <Card
            title="preset-base"
            href="/docs/theming/presets"
            description="The utility layer, without the opinions."
          />
        </Cards>
      </Section>

      <Section title="Built with Panda">
        <Cards columns={4} mode="gapless">
          <Card
            title="Park UI"
            href="https://park-ui.com/"
            description="Components built on Ark UI and Panda."
          />
          <Card
            title="Ark UI"
            href="https://ark-ui.com/"
            description="Headless components, styled with Panda."
          />
          <Card
            title="Cerberus"
            href="https://cerberus.digitalu.design/"
            description="An accessible design system on Panda."
          />
          <Card
            title="Showcase"
            href="/showcase"
            description="Products shipping on Panda today."
          />
        </Cards>
      </Section>
    </SitePage>
  )
}
