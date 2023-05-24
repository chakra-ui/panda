import Image from 'next/image'
import Link from 'next/link'
import { css } from '../styled-system/css'
import { Container, Flex, Wrap, panda } from '../styled-system/jsx'
import { button } from '../styled-system/recipes'
import { ButtonIcon } from '../theme/icons'

export const SectionFooter = () => {
  return (
    <panda.footer bg="bg.dark">
      <Container py="10">
        <Flex
          gap="6"
          direction={{ base: 'column', md: 'row' }}
          align={{ base: 'center', md: 'unset' }}
        >
          <panda.p
            color="yellow.300"
            textStyle={{ base: '8xl', md: 'panda.h1' }}
            letterSpacing="tighter"
            fontWeight="bold"
          >
            panda
          </panda.p>
          <Image
            src="/panda-hello.svg"
            width={196}
            height={261}
            alt="Yums the panda waving"
          />
        </Flex>

        <Wrap mt="12" justifyContent={{ base: 'center', md: 'unset' }}>
          <Link href="/docs" className={button({ color: 'ghost.white' })}>
            Docs
          </Link>
          {/* TODO fix links */}
          <Link href="/docs" className={button({ color: 'ghost.white' })}>
            Twitter{' '}
            <ButtonIcon
              icon="ExternalLink"
              className={css({ color: 'yellow.400' })}
            />
          </Link>
          {/* TODO fix links */}
          <Link href="/docs" className={button({ color: 'ghost.white' })}>
            Discord{' '}
            <ButtonIcon
              icon="ExternalLink"
              className={css({ color: 'yellow.400' })}
            />
          </Link>
          <Link
            href="https://github.com/chakra-ui/panda"
            target="_blank"
            className={button({ color: 'ghost.white' })}
          >
            Github{' '}
            <ButtonIcon
              icon="ExternalLink"
              className={css({ color: 'yellow.400' })}
            />
          </Link>
        </Wrap>
      </Container>
    </panda.footer>
  )
}
