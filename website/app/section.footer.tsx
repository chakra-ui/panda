import { css, cx } from '../styled-system/css'
import { Flex, Wrap, panda } from '../styled-system/jsx'
import Image from 'next/image'
import Link from 'next/link'
import { button } from '../styled-system/recipes'
import { ButtonIcon } from '../theme/icons'
import { ThemeSwitchButton } from './theme-switch-button'
import { Content } from './content'

export const SectionFooter = () => {
  return (
    <Flex
      bg="bg.dark"
      px="12"
      py="10"
      justify={{ base: 'center', md: 'unset' }}
      textAlign={{ base: 'center', md: 'unset' }}
    >
      <Content>
        <Flex direction={{ base: 'column', md: 'row' }}>
          <panda.h1
            color="yellow.300"
            textStyle={{ base: '7xl', md: 'panda.h1' }}
          >
            panda
          </panda.h1>
          <Image
            src="/panda-hello.svg"
            width={196}
            height={261}
            alt="Yums the panda waving"
            className={css({
              ml: { base: 'auto', md: '25px', lg: '50px!' },
              mr: { base: 'auto', md: 'unset' }
            })}
          />
        </Flex>
        <Wrap
          mt="50px"
          textStyle="xl"
          justifyContent={{ base: 'center', md: 'unset' }}
        >
          <Link
            href="/docs"
            className={cx(
              button({ color: 'ghost.white' }),
              css({ px: '2', py: 0, lg: { px: 6 } })
            )}
          >
            Docs
          </Link>
          {/* TODO fix links */}
          <Link
            href="/docs"
            className={cx(
              button({ color: 'ghost.white' }),
              css({ px: '2', py: 0, lg: { px: 6 } })
            )}
          >
            Twitter{' '}
            <ButtonIcon
              icon="ExternalLink"
              className={css({ color: 'yellow.400' })}
            />
          </Link>
          {/* TODO fix links */}
          <Link
            href="/docs"
            className={cx(
              button({ color: 'ghost.white' }),
              css({ px: '2', py: 0, lg: { px: 6 } })
            )}
          >
            Discord{' '}
            <ButtonIcon
              icon="ExternalLink"
              className={css({ color: 'yellow.400' })}
            />
          </Link>
          <Link
            href="https://github.com/chakra-ui/panda"
            target="_blank"
            className={cx(
              button({ color: 'ghost.white' }),
              css({ px: '2', py: 0, lg: { px: 6 } })
            )}
          >
            Github{' '}
            <ButtonIcon
              icon="ExternalLink"
              className={css({ color: 'yellow.400' })}
            />
          </Link>
          <ThemeSwitchButton />
        </Wrap>
      </Content>
    </Flex>
  )
}
