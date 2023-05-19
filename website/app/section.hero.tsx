import Image from 'next/image'
import { css, cx } from '../styled-system/css'
import { Flex, HStack, panda } from '../styled-system/jsx'
import { button } from '../styled-system/recipes'
import Link from 'next/link'
import { Content } from './content'

export const SectionHero = () => {
  return (
    <Flex justifyContent="center" backgroundColor="panda.bg.main">
      <Content>
        <Flex
          direction="column"
          w={{ lg: '66%' }}
          pt="145px"
          pb={{ base: '60px', lg: '95px' }}
          pl={{ lg: '52px' }}
          position="relative"
        >
          <panda.h4
            color="panda.text.muted"
            textStyle="panda.h4"
            fontWeight="semibold"
            maxW="815px"
          >
            CSS-in-JS with build time generated styles, RSC compatible,
            multi-variant support, and a best-in-class developer experience
          </panda.h4>
          <panda.h2
            textStyle="panda.h2"
            mt={{ base: '20px', md: '40px', lg: '70px' }}
            fontWeight="bold"
          >
            Write type-safe styles with ease using
          </panda.h2>
          <panda.h1 color="panda.text.headline" textStyle="panda.h1">
            panda
          </panda.h1>
          <Flex
            textStyle="2xl"
            mt={{ base: '40px', md: '80px' }}
            gap="25px"
            mdDown={{ flexDirection: 'column' }}
          >
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
            <Link
              href="/learn"
              className={cx(
                button({ color: 'black', size: 'lg' }),
                css({ w: '250px' })
              )}
            >
              Learn Panda
            </Link>
          </Flex>
          <HStack
            mt="35px"
            textStyle="xl"
            letterSpacing="tight"
            fontWeight="medium"
          >
            <panda.code
              color={{ base: 'rgba(0, 0, 0, 0.3)', _dark: 'panda.yellow' }}
            >
              $
            </panda.code>
            <panda.code>npm install @pandacss/dev</panda.code>
          </HStack>
          <Image
            src="/panda-bubble-tea.svg"
            width={369}
            height={478}
            alt="Yums the panda drinking a bubble tea"
            className={css({
              zIndex: 1,
              pointerEvents: 'none',
              position: 'absolute',
              bottom: '150px',
              right: '-40px',
              width: '150px',
              h: 'unset',
              '2xl': {
                bottom: '50px',
                right: '-150px',
                width: '369px'
              },
              xl: {
                right: '-250px',
                width: '300px'
              },
              lg: {
                right: '-300px'
              },
              md: {
                bottom: '100px',
                width: '300px',
                right: '0'
              }
            })}
          />
        </Flex>
      </Content>
    </Flex>
  )
}
