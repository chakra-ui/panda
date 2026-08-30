import { SitePage } from '@/components/site-page'
import { generateOgImageUrl } from '@/lib/og-image'
import { Card, Cards } from '@/mdx/cards'
import { Box } from '@/styled-system/jsx'
import type { Metadata } from 'next'
import { LuBookOpen, LuRocket, LuShuffle } from 'react-icons/lu'

const title = 'Guides'
const description = 'Task-shaped walkthroughs for common jobs in Panda.'

export const metadata: Metadata = {
  title: title,
  description,
  openGraph: {
    title,
    description,
    images: [generateOgImageUrl({ title, description, category: 'Guides' })]
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

export default function GuidesPage() {
  return (
    <SitePage kicker="Guides" title={title} description={description}>
      <Cards columns={3}>
        <Card
          icon={<LuRocket />}
          kicker="Start here"
          title="Thinking in Panda"
          href="/docs/styling/thinking-in-panda"
          description="The mental model, in about ten minutes."
          cta="Learn the model"
        />
        <Card
          icon={<LuShuffle />}
          kicker="Moving over"
          title="Migration strategy"
          href="/docs/styling/migration-strategy"
          description="How to move an existing codebase without a big-bang rewrite."
          cta="Plan a migration"
        />
        <Card
          icon={<LuBookOpen />}
          kicker="Go deeper"
          title="Build a design system"
          href="/docs/design-systems/building-a-design-system"
          description="Tokens, recipes and conditions in one shareable package."
          cta="Build a system"
        />
      </Cards>

      <Section title="Set up your framework">
        <Cards columns={4}>
          <Card title="Next.js" href="/docs/compiler/nextjs" description="App and pages router." />
          <Card title="Vite" href="/docs/compiler/vite" description="First-class Vite support." />
          <Card title="Astro" href="/docs/compiler/astro" description="Islands and static output." />
          <Card title="Vue" href="/docs/compiler/vue" description="SFC style extraction." />
          <Card title="Nuxt" href="/docs/compiler/nuxt" description="The Nuxt module." />
          <Card title="Svelte" href="/docs/compiler/svelte" description="Svelte and SvelteKit." />
          <Card title="Remix" href="/docs/compiler/remix" description="Remix and Vite." />
          <Card title="Storybook" href="/docs/compiler/storybook" description="Styles in your stories." />
        </Cards>
      </Section>

      <Section title="Move from another library">
        <Cards columns={4}>
          <Card title="Tailwind CSS" href="/docs/styling/tailwind" description="Utility classes to style objects." />
          <Card title="Chakra UI" href="/docs/styling/chakra-ui" description="Style props you already know." />
          <Card title="Styled Components" href="/docs/styling/styled-components" description="Template literals to objects." />
          <Card title="Emotion" href="/docs/styling/emotion" description="Runtime CSS-in-JS to build time." />
          <Card title="Stitches" href="/docs/styling/stitches" description="Variants and tokens, mapped over." />
          <Card title="Theme UI" href="/docs/styling/theme-ui" description="Theme objects to Panda tokens." />
          <Card title="StyleX" href="/docs/styling/stylex" description="Atomic to atomic, with types." />
          <Card title="Upgrading to v2" href="/docs/styling/upgrading-to-v2" description="What changed, and what to do." />
        </Cards>
      </Section>

      <Section title="Ship a design system">
        <Cards columns={4}>
          <Card title="Set up a library" href="/docs/design-systems/setup" description="One styled-system for you and your users." />
          <Card title="Wrap headless UI" href="/docs/design-systems/wrap-headless-ui" description="Ark or Radix primitives, styled." />
          <Card title="Publish to npm" href="/docs/design-systems/publishing-to-npm" description="Package and version your system." />
          <Card title="Monorepo workflow" href="/docs/design-systems/shared-styled-system" description="One system across many packages." />
        </Cards>
      </Section>

      <Section title="Tune the build">
        <Cards columns={4}>
          <Card title="Static CSS" href="/docs/compiler/static" description="Pre-generate what you can't extract." />
          <Card title="Performance" href="/docs/compiler/performance-optimization" description="Keep builds fast as you grow." />
          <Card title="Debugging" href="/docs/reference/debugging" description="See what Panda extracted, and why." />
          <Card title="Cascade layers" href="/docs/styling/cascade-layers" description="How Panda orders its output." />
        </Cards>
      </Section>
    </SitePage>
  )
}
