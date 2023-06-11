import { css } from '@/styled-system/css'
import { Circle, Container, Flex, Stack, panda } from '@/styled-system/jsx'
import { button } from '@/styled-system/recipes'
import { token } from '@/styled-system/tokens'
import { Icon } from '@/theme/icons'
import { outdent } from 'outdent'
import { Code, codeStyle } from '../code-highlight/code'
import { LearnMore } from '../learn-more'

const codeSnippet = outdent`
export const badge = cva({
  base: {
    fontWeight: 'medium',
    px: '3',
    rounded: 'md',
  },
  variants: {
    status: {
      default: {
        color: 'white',
        bg: 'gray.500',
      },
      success: {
        color: 'white',
        bg: 'green.500',
      },
      warning: {
        color: 'white',
        bg: 'yellow.500',
      },
    },
  },
  defaultVariants: {
    status: 'default',
  },
})`

export const SectionRecipes = () => {
  return (
    <panda.section bg="bg.main">
      <Container mb={{ lg: '-10rem' }}>
        <Flex
          direction={{ base: 'column', lg: 'row' }}
          gap="8"
          justify="space-between"
          py="20"
        >
          <Stack position="relative" gap="14" maxW={{ lg: '560px' }} pt="10">
            <Circle
              size="94px"
              className={button({ color: 'white', shape: 'circle' })}
              position="relative"
            >
              <Icon icon="Recipe" />
              <panda.div
                position="absolute"
                top="-2"
                right="-5"
                color="text.main"
              >
                <Icon
                  icon="Sparks2"
                  className={css({ w: '22px', h: '22px' })}
                />
              </panda.div>
            </Circle>

            <Stack gap="4">
              <panda.h3 textStyle="panda.h3" fontWeight="bold">
                Recipes and variants just like Stitches
              </panda.h3>
              <panda.h4
                textStyle="panda.h4"
                fontWeight="medium"
                color="text.muted"
              >
                Panda gives you a robust functions to define recipes and even
                “cva” to help you design composable component styles.
              </panda.h4>
            </Stack>

            <panda.div position={{ lg: 'absolute' }} bottom="40" left="0">
              <LearnMore />
            </panda.div>
          </Stack>

          <panda.div flex="1" maxW={{ lg: '40rem' }} flexShrink="0">
            {/* @ts-expect-error Server Component */}
            <Code
              lang="tsx"
              style={{ borderRadius: token('radii.xl') }}
              codeClassName={codeStyle}
            >
              {codeSnippet}
            </Code>
          </panda.div>
        </Flex>
      </Container>
    </panda.section>
  )
}
