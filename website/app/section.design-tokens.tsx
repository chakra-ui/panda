import Link from 'next/link'
import { css, cx } from '../styled-system/css'
import { Flex, Stack, panda } from '../styled-system/jsx'
import { button, code } from '../styled-system/recipes'
import { ButtonIcon, Icon } from '../theme/icons'
import { Content } from './content'
import { outdent } from 'outdent'
import { Code } from '../bright/code'

export const SectionDesignTokens = () => {
  return (
    <Flex
      bgColor="panda.bg.inverted"
      justifyContent="center"
      pt={{ base: '40px', lg: '105px' }}
      pb={{ base: '40px', lg: '95px' }}
    >
      <Content>
        <Stack
          lg={{ flexDirection: 'row' }}
          justifyContent="center"
          alignItems="center"
          mr="auto"
          pb={{ base: '40px', lg: '72px' }}
        >
          <panda.div
            w="173px"
            h="173px"
            boxShadowColor="panda.bg.dark"
            className={button({ color: 'yellow', shape: 'circle' })}
            position="relative"
            color="panda.text.headline"
          >
            <Icon icon="DesignTokenBox" />
            <panda.div
              position="absolute"
              top="-15px"
              right="-30px"
              color="panda.text.main"
            >
              <Icon icon="Sparks2" className={css({ w: '48px', h: '48px' })} />
            </panda.div>
          </panda.div>
          <Flex direction="column" ml={{ lg: '90px' }}>
            <panda.h3 textStyle="panda.h3" mt="53px">
              Design token support
            </panda.h3>
            <panda.h4 textStyle="panda.h4" color="panda.text.muted" mt="14px">
              Specify base and semantic tokens with ease using the W3C working
              token spec.
            </panda.h4>
          </Flex>
          {/* TODO fix links ? */}
          <Link
            href="/learn"
            className={cx(
              button({ color: 'ghost', size: 'xl' }),
              css({
                ml: { lg: 'auto' },
                fontSize: '32px',
                lineHeight: '40px',
                letterSpacing: 'tight',
                fontWeight: 'bold',
                flexShrink: 0,
                color: 'panda.text.headline'
              })
            )}
          >
            Learn more
            <ButtonIcon icon="RightArrowIcon" />
          </Link>
        </Stack>
        <Flex flexDirection={{ base: 'column', lg: 'row' }} gap="35px">
          <Flex w={{ lg: '55%' }} flexDirection="column">
            <panda.span
              ml="35px"
              display="inline-flex"
              alignSelf="start"
              py="10px"
              px="22px"
              roundedTop="lg"
              bgColor="panda.bg.main"
              fontWeight="semibold"
              textStyle="xl"
            >
              Core Tokens
            </panda.span>
            <panda.div
              w="100%"
              backgroundColor="panda.gray.600"
              borderRadius="16px"
            >
              {/* @ts-expect-error Server Component */}
              <Code lang="tsx" className={code()}>
                {outdent`const theme = {
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
              }`}
              </Code>
            </panda.div>
          </Flex>
          <Flex w={{ lg: '45%' }} flexDirection="column">
            <panda.span
              ml="35px"
              display="inline-flex"
              alignSelf="start"
              py="10px"
              px="22px"
              roundedTop="lg"
              bgColor="panda.bg.main"
              fontWeight="semibold"
              textStyle="xl"
            >
              Semantic Tokens
            </panda.span>
            <panda.div
              w="100%"
              backgroundColor="panda.gray.600"
              borderRadius="16px"
            >
              {/* @ts-expect-error Server Component */}
              <Code lang="tsx" className={code()}>
                {outdent`const theme = {
                  // ...
                  semanticTokens: {
                    colors: {
                      danger: { value: { base: '{colors.red}', _dark: '{colors.darkred}' } },
                      success: {
                        value: { base: '{colors.green}', _dark: '{colors.darkgreen}' }
                      }
                    }
                  }
                }`}
              </Code>
            </panda.div>
          </Flex>
        </Flex>
      </Content>
    </Flex>
  )
}
