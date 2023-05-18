import { css, cx } from '../styled-system/css'
import { Flex, Wrap, panda } from '../styled-system/jsx'
import Image from 'next/image'
import Link from 'next/link'
import { button } from '../styled-system/recipes'
import { ButtonIcon } from '../theme/icons'
import { ThemeSwitchButton } from './theme-switch-button'

export const SectionFooter = () => {
  return (
    <Flex
      bgColor="panda.bg.dark"
      px="50px"
      py="45px"
      justifyContent={{ base: 'center', md: 'unset' }}
      textAlign={{ base: 'center', md: 'unset' }}
    >
      <Flex direction="column" maxWidth={{ lg: '80%' }} w="100%">
        <Flex flexDirection={{ base: 'column', md: 'row' }}>
          <panda.h1
            color="panda.yellow"
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
              button({ color: 'ghost' }),
              css({ color: 'white', px: '2', py: 0, lg: { px: 6 } })
            )}
          >
            Docs
          </Link>
          {/* TODO fix links */}
          <Link
            href="/docs"
            className={cx(
              button({ color: 'ghost' }),
              css({ color: 'white', px: '2', py: 0, lg: { px: 6 } })
            )}
          >
            Twitter{' '}
            <ButtonIcon
              icon="ExternalLink"
              className={css({ color: 'panda.yellow' })}
            />
          </Link>
          {/* TODO fix links */}
          <Link
            href="/docs"
            className={cx(
              button({ color: 'ghost' }),
              css({ color: 'white', px: '2', py: 0, lg: { px: 6 } })
            )}
          >
            Discord{' '}
            <ButtonIcon
              icon="ExternalLink"
              className={css({ color: 'panda.yellow' })}
            />
          </Link>
          <Link
            href="https://github.com/chakra-ui/panda"
            target="_blank"
            className={cx(
              button({ color: 'ghost' }),
              css({ color: 'white', px: '2', py: 0, lg: { px: 6 } })
            )}
          >
            Github{' '}
            <ButtonIcon
              icon="ExternalLink"
              className={css({ color: 'panda.yellow' })}
            />
          </Link>
          <ThemeSwitchButton
            css={{ ["& [data-part='right-icon']"]: { color: 'panda.yellow' } }}
            color="white"
            p="2"
            py="0"
            lg={{ px: 6 }}
          />
        </Wrap>
      </Flex>
    </Flex>
  )
}
