import Link from 'next/link'
import { css, cx } from '../styled-system/css'
import { Flex, HStack, panda } from '../styled-system/jsx'
import { button } from '../styled-system/recipes'
import { ButtonIcon, Icon } from '../theme/icons'

export const SectionDesignTokens = () => {
  return (
    <Flex
      bgColor="panda.bg.inverted"
      justifyContent="center"
      pt="105px"
      pb="95px"
    >
      <Flex flexDirection="column" display="flex" maxWidth="80%">
        <HStack justifyContent="center" alignItems="center" mr="auto" pb="72px">
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
          <Flex direction="column" ml="90px">
            <panda.span
              fontSize="40px"
              lineHeight="50px"
              letterSpacing="tight"
              fontWeight="bold"
              mt="53px"
            >
              Design token support
            </panda.span>
            <panda.span
              fontSize="26px"
              lineHeight="34px"
              letterSpacing="tight"
              color="panda.text.muted"
              fontWeight="semibold"
              mt="14px"
            >
              Specify base and semantic tokens with ease using the W3C working
              token spec.
            </panda.span>
          </Flex>
          {/* TODO fix links */}
          <Link
            href="/docs/getting-started"
            className={cx(
              button({ color: 'ghost', size: 'xl' }),
              css({
                ml: 'auto',
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
        </HStack>
        <Flex>
          <Flex w="55%" flexDirection="column">
            <panda.span
              ml="35px"
              display="inline-flex"
              alignSelf="start"
              py="10px"
              px="22px"
              roundedTop="lg"
              bgColor="panda.bg.main"
              fontWeight="semibold"
              fontSize="19px"
              lineHeight="19px"
            >
              Core Tokens
            </panda.span>
            {/* TODO code example */}
            <panda.div
              w="100%"
              h="445px"
              backgroundColor="panda.gray.600"
              borderRadius="16px"
            ></panda.div>
          </Flex>
          <Flex w="45%" flexDirection="column" ml="5">
            <panda.span
              ml="35px"
              display="inline-flex"
              alignSelf="start"
              py="10px"
              px="22px"
              roundedTop="lg"
              bgColor="panda.bg.main"
              fontWeight="semibold"
              fontSize="19px"
              lineHeight="19px"
            >
              Semantic Tokens
            </panda.span>
            {/* TODO code example */}
            <panda.div
              w="100%"
              h="445px"
              backgroundColor="panda.gray.600"
              borderRadius="16px"
            ></panda.div>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}
