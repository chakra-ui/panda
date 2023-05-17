import Link from 'next/link'
import { css, cx } from '../styled-system/css'
import { Flex, panda } from '../styled-system/jsx'
import { button } from '../styled-system/recipes'
import Image from 'next/image'

export const SectionStartBuilding = () => {
  return (
    <Flex
      direction="column"
      alignItems="center"
      justifyContent="center"
      bgColor="panda.bg.main"
      position="relative"
      pt="225px"
      pb="90px"
    >
      <Image
        src="/panda-rocket.svg"
        width={213}
        height={242}
        alt="Yums the panda riding a rocket"
        className={css({
          position: 'absolute',
          top: '-75px',
          left: '50%',
          transform: 'translateX(-50%)'
        })}
      />
      <Flex direction="column" maxWidth="80%" alignItems="center">
        <panda.span
          fontSize={{ base: '2.75rem', lg: '3.875rem' }}
          lineHeight={{ base: '3rem', lg: '4.875rem' }}
          letterSpacing="tight"
          fontWeight="bold"
          textAlign="center"
        >
          Start building with <br />
          Panda today
        </panda.span>
        <Flex
          textStyle="2xl"
          mt="36px"
          flexDirection={{ base: 'column', lg: 'row' }}
          gap="25px"
        >
          {/* TODO fix href */}
          <Link
            href="/docs/getting-started/cli"
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
      </Flex>
    </Flex>
  )
}
