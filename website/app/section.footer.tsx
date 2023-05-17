import { css, cx } from '../styled-system/css'
import { Flex, HStack, panda } from '../styled-system/jsx'
import Image from 'next/image'
import Link from 'next/link'
import { button } from '../styled-system/recipes'
import { ButtonIcon } from '../theme/icons'
import { ThemeSwitchButton } from './theme-switch-button'

export const SectionFooter = () => {
  return (
    <Flex bgColor="panda.bg.dark" px="50px" py="45px">
      <Flex direction="column">
        <Flex>
          <panda.h1
            color="panda.yellow"
            fontSize="232px"
            lineHeight="190px"
            letterSpacing="tighter"
            fontWeight="bold"
          >
            panda
          </panda.h1>
          <Image
            src="/panda-hello.svg"
            width={196}
            height={261}
            alt="Yums the panda waving"
            className={css({ ml: '50px' })}
          />
        </Flex>
        <HStack mt="50px" display="flex" fontSize="21px">
          {/* TODO fix links */}
          <Link
            href="/docs"
            className={cx(
              button({ color: 'ghost' }),
              css({ color: 'white', py: 0 })
            )}
          >
            Docs
          </Link>
          {/* TODO fix links */}
          <Link
            href="/docs"
            className={cx(
              button({ color: 'ghost' }),
              css({ color: 'white', py: 0 })
            )}
          >
            Twitter <ButtonIcon icon="ExternalLink" />
          </Link>
          {/* TODO fix links */}
          <Link
            href="/docs"
            className={cx(
              button({ color: 'ghost' }),
              css({ color: 'white', py: 0 })
            )}
          >
            Discord <ButtonIcon icon="ExternalLink" />
          </Link>
          {/* TODO fix links */}
          <Link
            href="/docs"
            className={cx(
              button({ color: 'ghost' }),
              css({ color: 'white', py: 0 })
            )}
          >
            Github <ButtonIcon icon="ExternalLink" />
          </Link>
          <ThemeSwitchButton color="white" />
        </HStack>
      </Flex>
    </Flex>
  )
}
