import Link from 'next/link'
import { css, cx } from '../styled-system/css'
import { Flex, Stack, panda } from '../styled-system/jsx'
import { button } from '../styled-system/recipes'
import { ButtonIcon, Icon } from '../theme/icons'

export const SectionModernCss = () => {
  return (
    <panda.div
      display="flex"
      justifyContent="center"
      bgColor="panda.bg.main"
      h="650px"
      pt="100px"
    >
      <Flex
        justifyContent="center"
        alignItems="center"
        maxWidth="80%"
        position="relative"
      >
        <Stack
          justifyContent="center"
          alignItems="flex-start"
          maxWidth="45%"
          mr="auto"
          pb="92px"
        >
          <panda.div
            w="93px"
            h="93px"
            className={button({ shape: 'circle' })}
            position="relative"
            bgColor="white"
            color="black"
          >
            <Icon icon="Css3" />
            <panda.div
              position="absolute"
              top="-7px"
              right="-18px"
              color="panda.text.main"
            >
              <Icon icon="Sparks2" className={css({ w: '22px', h: '22px' })} />
            </panda.div>
          </panda.div>
          <panda.span
            fontSize="40px"
            lineHeight="50px"
            letterSpacing="tight"
            fontWeight="bold"
            mt="53px"
          >
            Generates Modern CSS code at build time
          </panda.span>
          <panda.span
            fontSize="26px"
            lineHeight="34px"
            letterSpacing="tight"
            color="panda.text.muted"
            fontWeight="semibold"
            mt="20px"
          >
            Panda uses modern features like cascade layers, :where selectors and
            css variables to give you best-in-class css output.
          </panda.span>
          {/* TODO fix links */}
          <Link
            href="/docs/getting-started"
            className={cx(
              button({ color: 'ghost', size: 'xl' }),
              css({ px: 0, color: 'panda.text.headline' })
            )}
          >
            Learn more
            <ButtonIcon icon="RightArrowIcon" />
          </Link>
        </Stack>
        {/* TODO code example */}
        <panda.div
          position="absolute"
          right="0"
          bottom="-46px"
          w="570px"
          h="600px"
          backgroundColor="panda.gray.600"
          borderRadius="16px"
        ></panda.div>
      </Flex>
    </panda.div>
  )
}
