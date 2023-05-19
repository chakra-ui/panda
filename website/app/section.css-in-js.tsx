import { css } from '../styled-system/css'
import { Flex, HStack, Stack, panda } from '../styled-system/jsx'
import { Icon } from '../theme/icons'

import { code, content } from '../styled-system/recipes'
import { Code } from '../bright/code'
import { tabs } from '../bright/extension'
import { outdent } from 'outdent'

const examples = [
  {
    code: outdent`
    import { css } from './styled-system/css'
    import { circle, stack } from './styled-system/patterns'

    function App() {
        return (
            <div className={stack({ direction: 'row', p: '4' })}>
                <div className={circle({ size: '5rem', overflow: 'hidden' })}>
                    <img src="https://via.placeholder.com/150" alt="avatar" />
                </div>
                <div className={css({ mt: '4', fontSize: 'xl', fontWeight: 'semibold' })}> John Doe
                </div>
                <div className={css({ mt: '2', fontSize: 'sm', color: 'gray.600' })}>
                    john@doe.com
                </div>
            </div>
        )
    }`,
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

export const SectionCssInJS = () => {
  return (
    <panda.div
      display="flex"
      justifyContent="center"
      bgColor="panda.bg.muted"
      pt={{ base: '50px', lg: '138px' }}
      pb={{ base: '50px', lg: '170px' }}
    >
      <Stack justifyContent="center" alignItems="center" className={content()}>
        <panda.h2
          color="white"
          textStyle="panda.h2"
          fontWeight="semibold"
          textAlign={{ base: 'center', lg: 'left' }}
        >
          Styling library{' '}
          <panda.span color="panda.yellow">you’ll enjoy</panda.span> using 🐼
        </panda.h2>
        <panda.div w="90%" maxW="870px" mt={{ lg: '50px' }} borderRadius="19px">
          {/* @ts-expect-error Server Component */}
          <Code
            lang="tsx"
            // TODO tabs style
            extensions={[tabs]}
            subProps={examples}
            className={code()}
          />
        </panda.div>
        <panda.div display="flex" justifyContent="center" maxW="80%">
          <panda.span
            fontSize={{ base: '1.35rem', lg: '2rem' }}
            lineHeight={{ base: '1.85rem', lg: '2.625rem' }}
            letterSpacing="tight"
            mt={{ base: '20px', md: '68px' }}
            color="white"
            textAlign="center"
            fontWeight="semibold"
          >
            CSS-in-JS with build time generated styles, RSC compatible,
            multi-variant support.
          </panda.span>
        </panda.div>
        <Flex
          textStyle="xl"
          mt={{ base: '20px', lg: '75.5px' }}
          justifyContent="space-between"
          w="100%"
          flexDirection={{ base: 'column', lg: 'row' }}
          alignItems={{ base: 'center', lg: 'flex-start' }}
          gap="8"
        >
          <Stack w="250px">
            <HStack>
              <Icon
                icon="FastForwardArrow"
                className={css({ color: 'panda.yellow' })}
              />
              <panda.span color="white" fontWeight="semibold">
                Zero runtime
              </panda.span>
            </HStack>
            <panda.span color="panda.gray.200">
              Generates static CSS at build-time
            </panda.span>
          </Stack>
          <Stack w="250px">
            <HStack>
              <Icon
                icon="TypescriptLogo"
                className={css({ color: 'panda.yellow' })}
              />
              <panda.span color="white" fontWeight="semibold">
                Type safety
              </panda.span>
            </HStack>
            <panda.span color="panda.gray.200">
              Break larger tasks into smaller issues
            </panda.span>
          </Stack>
          <Stack w="250px">
            <HStack>
              <Icon icon="Sparks" className={css({ color: 'panda.yellow' })} />
              <panda.span color="white" fontWeight="semibold">
                Amazing DX
              </panda.span>
            </HStack>
            <panda.span color="panda.gray.200">
              Low learning curve and best dev. experience
            </panda.span>
          </Stack>
        </Flex>
      </Stack>
    </panda.div>
  )
}
