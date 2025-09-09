import { ButtonLink } from '@/components/ui/button'
import { Container, Stack, panda } from '@/styled-system/jsx'
import { Icon } from '@/theme/icons'
import Image from 'next/image'

export const CommunitySection = () => {
  return (
    <panda.section position="relative" bg="bg" overflow="hidden">
      <panda.div
        display={{ base: 'none', md: 'block' }}
        position="absolute"
        top="2%"
        right="-16%"
        pointerEvents="none"
      >
        <Image
          width="800"
          height="800"
          alt=""
          src="/community.png"
          style={{ height: '100%', width: '800px' }}
        />
      </panda.div>

      <Container pt="32" pb="40">
        <Stack gap="10" align="flex-start" maxWidth="580px">
          <Stack gap="6" bg="bg">
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

          <ButtonLink
            href="https://discord.gg/VQrkpsgSx7"
            size="lg"
            color="www"
            variant="funky"
          >
            Join our Discord
            <Icon icon="ExternalLink" />
          </ButtonLink>
        </Stack>
      </Container>
    </panda.section>
  )
}
