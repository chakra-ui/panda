import { css } from '../styled-system/css'
import { HStack, Stack, VStack, panda } from '../styled-system/jsx'
import { Icon, IconType } from '../theme/icons'

import { Code } from '../bright/code'
import { tabs } from '../bright/code-tabs.extension'
import { outdent } from 'outdent'

const codeSnippets = [
  {
    code: outdent`
    import { css } from "./styled-system/css";
    import { circle, stack } from "./styled-system/patterns";

    function App() {
      return (
        <div className={stack({ direction: "row", p: "4" })}>
          <div className={circle({ size: "5rem", overflow: "hidden" })}>
            <img src="https://via.placeholder.com/150" alt="avatar" />
          </div>
          <div className={css({ mt: "4", fontSize: "xl", fontWeight: "semibold" })}>
            John Doe
          </div>
          <div className={css({ mt: "2", fontSize: "sm", color: "gray.600" })}>
            john@doe.com
          </div>
        </div>
      );
    }
`,
    title: 'style-functions.tsx',
    lang: 'tsx'
  },
  {
    code: outdent`
    import { Box, Stack, Circle } from './styled-system/jsx'

    function App() {
      return (
        <Stack direction="row" p="4" rounded="md" shadow="lg" bg="white">
          <Circle size="5rem" overflow="hidden">
            <img src="https://via.placeholder.com/150" alt="avatar" />
          </Circle>
          <Box mt="4" fontSize="xl" fontWeight="semibold">
            John Doe
          </Box>
          <Box mt="2" fontSize="sm" color="gray.600">
            john@doe.com
          </Box>
        </Stack>
      )
    }
    `,
    title: 'style-props.tsx',
    lang: 'tsx'
  },
  {
    code: outdent`TODO`,
    title: 'design-tokens.ts',
    lang: 'ts'
  }
]

const features: Array<{ title: string; description: string; icon: IconType }> =
  [
    {
      title: 'Zero runtime',
      description: 'Generates static CSS at build-time',
      icon: 'FastForwardArrow'
    },
    {
      title: 'Type safe',
      description: 'TypeScript support out of the box',
      icon: 'TypescriptLogo'
    },
    {
      title: 'Amazing DX',
      description: 'Low learning curve, great developer experience',
      icon: 'Sparks'
    }
  ]

export const SectionCssInJS = () => {
  return (
    <panda.section bg="black" py="12rem" color="white">
      <panda.div maxW="8xl" mx="auto" px={{ base: '4', md: '6', lg: '8' }}>
        <VStack gap="16">
          <panda.h2
            textStyle="panda.h2"
            fontWeight="semibold"
            textAlign={{ base: 'center', lg: 'left' }}
          >
            Styling library{' '}
            <panda.span color="yellow.300">you’ll enjoy</panda.span> using 🐼
          </panda.h2>

          <panda.div width="full" maxW="4xl" mx="auto">
            {/* @ts-expect-error Server Component */}
            <Code lang="tsx" extensions={[tabs]} subProps={codeSnippets} />
          </panda.div>

          <VStack maxW={{ base: '2xl', lg: '5xl' }} mx="auto" gap="16">
            <panda.span textStyle="panda.h3" textAlign="center">
              CSS-in-JS with build time generated styles, RSC compatible,
              multi-variant support.
            </panda.span>

            <Stack
              direction={{ base: 'column', lg: 'row' }}
              align={{ base: 'center', lg: 'flex-start' }}
              justify="space-between"
              w="100%"
              gap="8"
            >
              {features.map(({ title, description, icon }) => (
                <Stack maxW="440px" textStyle="xl" width="full">
                  <HStack>
                    <Icon
                      icon={icon}
                      className={css({ color: 'yellow.300' })}
                    />
                    <panda.span fontWeight="semibold">{title}</panda.span>
                  </HStack>
                  <panda.span color="gray.200" maxW={{ lg: '256px' }}>
                    {description}
                  </panda.span>
                </Stack>
              ))}
            </Stack>
          </VStack>
        </VStack>
      </panda.div>
    </panda.section>
  )
}
