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
          fontSize="62px"
          lineHeight="78px"
          letterSpacing="tight"
          fontWeight="bold"
          textAlign="center"
        >
          Start building with <br />
          Panda today
        </panda.span>
        <Flex fontSize="24px" mt="36px">
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
            href="/docs/getting-started"
            className={cx(
              button({ color: 'black', size: 'lg' }),
              css({ w: '250px', ml: '25px' })
            )}
          >
            Learn Panda
          </Link>
        </Flex>
      </Flex>
    </Flex>
  )
}
