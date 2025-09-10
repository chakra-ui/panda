import { ButtonLink } from '@/components/ui/button'
import { docsConfig } from '@/docs.config'
import { Container, Flex, Wrap, panda } from '@/styled-system/jsx'
import { Icon } from '@/theme/icons'
import Image from 'next/image'

export const FooterSection = () => {
  const { twitterUrl, discordUrl, docsRepositoryBase } = docsConfig
  return (
    <panda.footer bg="bg.inverted">
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
          <ButtonLink href="/docs" color="ghost.white">
            Docs
          </ButtonLink>
          <ButtonLink href={twitterUrl} color="ghost.white">
            Twitter (X)
            <Icon icon="ExternalLink" />
          </ButtonLink>
          <ButtonLink href={discordUrl} color="ghost.white">
            Discord
            <Icon icon="ExternalLink" />
          </ButtonLink>
          <ButtonLink href={docsRepositoryBase} color="ghost.white">
            Github
            <Icon icon="ExternalLink" />
          </ButtonLink>
        </Wrap>
      </Container>
    </panda.footer>
  )
}
