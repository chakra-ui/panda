import { css } from '@/styled-system/css'
import { Box, Circle, Container, Stack, panda } from '@/styled-system/jsx'
import { button } from '@/styled-system/recipes'
import { token } from '@/styled-system/tokens'
import { Icon } from '@/theme/icons'
import { outdent } from 'outdent'
import { Code, codeStyle } from '../code-highlight/code'
import { LearnMore } from '../learn-more'

const codeSnippets = {
  coreTokens: outdent`
  const theme = {
    tokens: {
      colors: {
        primary: { value: '#0FEE0F' },
        secondary: { value: '#EE0F0F' }
      },
      fonts: {
        body: { value: 'system-ui, sans-serif' }
      },
      sizes: {
        small: { value: '12px' },
        medium: { value: '16px' },
        large: { value: '24px' }
      }
    }
  }`,
  semanticTokens: outdent`
  const theme = {
    semanticTokens: {
      colors: {
        danger: {
          value: { base: '{colors.red.500}', _dark: '{colors.red.200}' }
        },
        success: {
          value: { base: '{colors.green.500}', _dark: '{colors.green.300}' }
        },
        muted:{
          value: { base: '{colors.gray.500}', _dark: '{colors.gray.300}' }
        },
        canvas: { value : '{colors.white}' }
      }
    }
  }`
}

const CodePanel = (props: {
  title: string
  children: string
  className?: string
}) => {
  const { title, children, className } = props
  return (
    <div className={className}>
      <panda.span
        ml="8"
        display="inline-flex"
        py="2"
        px="4"
        roundedTop="lg"
        bg="bg.main"
        fontWeight="semibold"
        textStyle="xl"
      >
        {title}
      </panda.span>
      <panda.div flexShrink="0">
        <Code
          lang="tsx"
          style={{ borderRadius: token('radii.xl'), margin: '0' }}
          codeClassName={codeStyle}
        >
          {children}
        </Code>
      </panda.div>
    </div>
  )
}

export const SectionDesignTokens = () => {
  return (
    <panda.section bg="bg.inverted">
      <Container pt={{ base: '20', lg: '40' }} pb={{ base: '16', lg: '32' }}>
        <Stack
          gap="20"
          direction={{ base: 'column', lg: 'row' }}
          align={{ lg: 'center' }}
          mb="20"
        >
          <Circle
            size="173px"
            boxShadowColor="bg.dark"
            className={button({ color: 'yellow', shape: 'circle' })}
            position="relative"
            color="text.headline"
          >
            <Icon icon="DesignTokenBox" />
            <panda.div
              position="absolute"
              top="-15px"
              right="-30px"
              color="text.main"
            >
              <Icon icon="Sparks2" className={css({ w: '48px', h: '48px' })} />
            </panda.div>
          </Circle>

          <Box flex="1">
            <Stack maxW={{ lg: '560px' }}>
              <panda.h3 textStyle="panda.h3" fontWeight="bold">
                Design token support
              </panda.h3>
              <panda.h4
                textStyle="panda.h4"
                fontWeight="medium"
                color="text.muted"
              >
                Specify base and semantic tokens with ease using the W3C working
                token spec.
              </panda.h4>
            </Stack>
          </Box>

          <LearnMore href="/docs/theming/tokens" />
        </Stack>

        <Stack direction={{ base: 'column', lg: 'row' }} gap="10">
          <CodePanel title="Core Tokens" className={css({ flex: '40%' })}>
            {codeSnippets.coreTokens}
          </CodePanel>
          <CodePanel title="Semantic Tokens" className={css({ flex: '60%' })}>
            {codeSnippets.semanticTokens}
          </CodePanel>
        </Stack>
      </Container>
    </panda.section>
  )
}
