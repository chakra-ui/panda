import Link from 'next/link'
import { css, cx } from '../styled-system/css'
import { Flex, panda } from '../styled-system/jsx'
import { button } from '../styled-system/recipes'
import { ButtonIcon, Icon } from '../theme/icons'

export const SectionRecipes = () => {
  return (
    <Flex bgColor="panda.bg.main" justifyContent="center" pt="55px" pb="58px">
      <Flex maxWidth="80%" flexDirection={{ base: 'column', lg: 'row' }}>
        <Flex
          w={{ lg: '55%' }}
          flexDirection="column"
          direction="column"
          justifyContent="center"
          alignItems="flex-start"
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
              color="panda.text.main"
            >
              <Icon
                icon="Sparks2"
                className={css({
                  w: '22px',
                  h: '22px',
                  color: 'panda.text.headline'
                })}
              />
            </panda.div>
          </panda.div>
          <panda.h3 textStyle="panda.h3" mt="53px">
            Recipes and variants just like Stitches
          </panda.h3>
          <panda.h4 mt="28px" textStyle="panda.h4" color="panda.text.muted">
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
                color: 'panda.text.headline',
                px: 0
              })
            )}
          >
            Learn more
            <ButtonIcon icon="RightArrowIcon" />
          </Link>
        </Flex>
        <Flex w={{ lg: '45%' }} flexDirection="column" ml="5">
          {/* TODO code example */}
          <panda.div
            w="100%"
            h="725px"
            backgroundColor="panda.gray.600"
            borderRadius="16px"
          ></panda.div>
        </Flex>
      </Flex>
    </Flex>
  )
}
