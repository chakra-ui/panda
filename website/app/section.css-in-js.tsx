import { css } from '../styled-system/css'
import { Flex, HStack, Stack, panda } from '../styled-system/jsx'
import { Icon } from '../theme/icons'

export const SectionCssInJS = () => {
  return (
    <panda.div
      display="flex"
      justifyContent="center"
      bgColor="panda.bg.muted"
      pt={{ base: '50px', lg: '138px' }}
      pb={{ base: '50px', lg: '170px' }}
    >
      <Stack justifyContent="center" alignItems="center" maxWidth="80%">
        <panda.h2
          color="white"
          textStyle="panda.h2"
          fontWeight="semibold"
          textAlign={{ base: 'center', lg: 'left' }}
        >
          Styling library{' '}
          <panda.span color="panda.yellow">you’ll enjoy</panda.span> using 🐼
        </panda.h2>
        {/* TODO code example */}
        <panda.div
          w="90%"
          maxW="870px"
          h="526px"
          mt={{ lg: '50px' }}
          backgroundColor="panda.gray.50"
        ></panda.div>
        <panda.div display="flex" justifyContent="center" maxW="80%">
          <panda.span
            fontSize={{ base: '1.35rem', lg: '2rem' }}
            lineHeight="2.625rem"
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
