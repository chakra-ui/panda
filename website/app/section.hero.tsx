import { css, cx } from '../styled-system/css'
import { Flex, HStack, panda } from '../styled-system/jsx'
import { button } from '../styled-system/recipes'
import Link from 'next/link'

export const SectionHero = () => {
  return (
    <panda.div backgroundColor="panda.bg.main">
      <Flex direction="column" w="66%" pt="145px" pb="95px" pl="52px">
        <panda.h3
          color="panda.text.muted"
          fontSize="26px"
          lineHeight="34px"
          letterSpacing="tight"
        >
          CSS-in-JS with build time generated styles, RSC compatible,
          multi-variant support, and a best-in-class developer experience
        </panda.h3>
        <panda.h2
          fontSize="49px"
          lineHeight="47px"
          mt="70px"
          letterSpacing="tighter"
          fontWeight="bold"
        >
          Write type-safe styles with ease using
        </panda.h2>
        <panda.h1
          color="panda.text.headline"
          fontSize="232px"
          lineHeight="190px"
          letterSpacing="tighter"
          fontWeight="bold"
        >
          panda
        </panda.h1>
        <Flex fontSize="24px" mt="80px">
          {/* TODO fix href */}
          <Link
            href="/docs/getting-started"
            className={cx(
              button({ color: 'main', size: 'lg' }),
              css({ w: '250px' })
            )}
          >
            Get Started
          </Link>
          {/* TODO fix links */}
          <Link
            href="/docs/getting-started"
            className={cx(
              button({ color: 'black', size: 'lg' }),
              css({ w: '250px', ml: '25px' })
            )}
          >
            Learn Panda
          </Link>
        </Flex>
        <HStack mt="35px" fontSize="20px" letterSpacing="tight">
          <panda.code
            color={{ base: 'rgba(0, 0, 0, 0.3)', _dark: 'panda.yellow' }}
          >
            $
          </panda.code>
          <panda.code>npm install @pandacss/dev</panda.code>
        </HStack>
      </Flex>
    </panda.div>
  )
}
