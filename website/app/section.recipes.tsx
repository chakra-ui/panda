import Link from 'next/link'
import { css, cx } from '../styled-system/css'
import { Flex, panda } from '../styled-system/jsx'
import { button, code } from '../styled-system/recipes'
import { ButtonIcon, Icon } from '../theme/icons'
import { Content } from './content'
import { Code } from '../bright/code'
import { outdent } from 'outdent'

export const SectionRecipes = () => {
  return (
    <Flex bg="bg.main" justifyContent="center" pt="55px" pb="58px">
      <Content flexDirection={{ base: 'column', lg: 'row' }}>
        <Flex
          w={{ lg: '55%' }}
          direction="column"
          justify="center"
          align="flex-start"
          mr="auto"
          pb="72px"
        >
          <panda.div
            alignSelf={{ base: 'center', lg: 'flex-start' }}
            w="93px"
            h="93px"
            className={button({ color: 'white', shape: 'circle' })}
            position="relative"
          >
            <Icon icon="Recipe" />
            <panda.div
              position="absolute"
              top="-7px"
              right="-18px"
              color="text.main"
            >
              <Icon
                icon="Sparks2"
                className={css({
                  w: '22px',
                  h: '22px',
                  color: 'text.headline'
                })}
              />
            </panda.div>
          </panda.div>
          <panda.h3 textStyle="panda.h3" mt="53px">
            Recipes and variants just like Stitches
          </panda.h3>
          <panda.h4 mt="28px" textStyle="panda.h4" color="text.muted">
            Panda gives you a robust functions to define recipes and even “cva”
            to help you design composable component styles.
          </panda.h4>
          <Link
            href="/learn"
            className={cx(
              button({ color: 'ghost', size: 'xl' }),
              css({
                mt: '20px',
                lg: { mt: '150px' },
                fontSize: '32px',
                lineHeight: '40px',
                letterSpacing: 'tight',
                fontWeight: 'bold',
                color: 'text.headline',
                _hover: {
                  bg: 'white',
                  color: 'black',
                  _dark: {
                    bg: 'yellow.400'
                  }
                },
                ml: -6
              })
            )}
          >
            Learn more
            <ButtonIcon icon="RightArrowIcon" />
          </Link>
        </Flex>
        <Flex w={{ lg: '45%' }} direction="column" ml="5">
          <panda.div w="100%" bg="gray.600" borderRadius="16px">
            {/* @ts-expect-error Server Component */}
            <Code lang="tsx" className={code()}>
              {outdent`export const badge = cva({
                  base: {
                    fontWeight: 'medium',
                    letterSpacing: 'wide',
                    flexGrow: '0',
                    px: '3',
                    alignSelf: 'flex-start',
                    borderRadius: 'md',
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
                })`}
            </Code>
          </panda.div>
        </Flex>
      </Content>
    </Flex>
  )
}
