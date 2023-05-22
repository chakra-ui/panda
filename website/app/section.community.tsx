import Image from 'next/image'
import Link from 'next/link'
import { css, cx } from '../styled-system/css'
import { Container, Stack, panda } from '../styled-system/jsx'
import { button } from '../styled-system/recipes'
import { ButtonIcon } from '../theme/icons'

export const SectionCommunity = () => {
  return (
    <panda.section position="relative" bg="bg.inverted" overflow="hidden">
      <panda.div
        display={{ base: 'none', md: 'block' }}
        position="absolute"
        bottom="-56%"
        right="-7%"
        pointerEvents="none"
      >
        <Image
          width="800"
          height="800"
          alt=""
          src="/community.png"
          style={{ objectFit: 'contain' }}
        />
      </panda.div>

      <Container pt="32" pb="40">
        <Stack gap="10" align="flex-start" maxWidth="580px">
          <Stack gap="6" bg="bg.inverted">
            <panda.h3 textStyle="panda.h3" fontWeight="bold">
              Join our community
            </panda.h3>
            <panda.span
              textStyle="2xl"
              letterSpacing="tight"
              fontWeight="medium"
            >
              Get support, get involved and join our community of developers -
              Hop into our Discord
            </panda.span>
          </Stack>

          <Link
            href="/docs/getting-started"
            className={cx(
              button({ size: 'lg' }),
              css({
                color: { base: 'black', _hover: 'white' },
                bg: { base: 'yellow.300', _hover: 'gray.400' },
                _dark: {
                  _hover: {
                    shadowColor: 'gray.200'
                  }
                }
              })
            )}
          >
            Join our Discord
            <ButtonIcon icon="ExternalLink" />
          </Link>
        </Stack>
      </Container>
    </panda.section>
  )
}
