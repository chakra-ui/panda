import Link from 'next/link'
import { css, cx } from '../styled-system/css'
import { Center, Flex, HTMLPandaProps, panda } from '../styled-system/jsx'
import { button } from '../styled-system/recipes'
import { ButtonIcon, Icon } from '../theme/icons'

export const SectionCommunity = () => {
  return (
    <Flex
      pos="relative"
      bgColor="panda.bg.inverted"
      justifyContent="center"
      pb="200px"
      overflow="hidden"
    >
      <Flex maxWidth="80%">
        <Flex
          w="55%"
          flexDirection="column"
          direction="column"
          justifyContent="center"
          alignItems="flex-start"
          mr="auto"
          pb="72px"
        >
          <panda.span
            fontSize="40px"
            lineHeight="60px"
            letterSpacing="tight"
            fontWeight="bold"
            mt="155px"
          >
            Join our community
          </panda.span>
          <panda.span
            mt="18px"
            fontSize="23px"
            lineHeight="31px"
            letterSpacing="tight"
            fontWeight="semibold"
          >
            Get support, get involved and join our community of developers - Hop
            into our Discord
          </panda.span>
          {/* TODO fix links */}
          <Link
            href="/docs/getting-started"
            className={cx(
              button({ size: 'xl' }),
              css({
                mt: '40px',
                borderWidth: '4px',
                letterSpacing: 'tight',
                fontWeight: '600',
                color: 'black',
                bgColor: 'panda.yellow'
              })
            )}
          >
            Join our Discord
            <ButtonIcon icon="ExternalLink" />
          </Link>
        </Flex>
        <Center
          position="absolute"
          top="100px"
          right="0"
          transform="translateX(30%)"
          w="740px"
          h="740px"
          borderWidth="2px"
          borderRadius="20px"
          borderColor={{ base: '#EAEAEA', _dark: '#383838' }}
        >
          <Center
            w="75%"
            h="75%"
            position="relative"
            borderWidth="2px"
            borderRadius="20px"
            borderColor={{ base: '#EAEAEA', _dark: '#383838' }}
          >
            <Center
              w="63%"
              h="63%"
              position="relative"
              borderWidth="2px"
              borderRadius="20px"
              borderColor={{ base: '#EAEAEA', _dark: '#383838' }}
            >
              <Center
                w="47%"
                h="47%"
                position="relative"
                borderWidth="2px"
                borderRadius="20px"
                borderColor={{ base: '#EAEAEA', _dark: '#383838' }}
              >
                <panda.div
                  w="64px"
                  h="64px"
                  className={button({ color: 'yellow' })}
                  bgColor="panda.yellow"
                  color="black"
                  p="0"
                >
                  <Icon icon="LogoLetter" width="38" height="38" />
                </panda.div>
              </Center>
              <TeamMember
                left="0"
                top="48%"
                transform="translate3d(-50%, -50%, 0)"
              />
              <TeamMember
                top="0"
                left="45%"
                transform="translate3d(-50%, -50%, 0)"
              />
            </Center>
            <TeamMember
              left="0"
              top="27%"
              transform="translate3d(-50%, -50%, 0)"
            />
            <TeamMember
              top="0"
              left="27%"
              transform="translate3d(-50%, -50%, 0)"
            />
          </Center>
          <TeamMember
            left="0"
            top="15%"
            transform="translate3d(-50%, -50%, 0)"
          />
          <TeamMember
            left="0"
            top="60%"
            transform="translate3d(-50%, -50%, 0)"
          />
          <TeamMember
            top="0"
            left="20%"
            transform="translate3d(-50%, -50%, 0)"
          />
          <TeamMember
            top="0"
            left="55%"
            transform="translate3d(-50%, -50%, 0)"
          />
        </Center>
      </Flex>
    </Flex>
  )
}

{
  /* TODO member photos */
}
const TeamMember = (props: HTMLPandaProps<'div'>) => (
  <panda.div
    position="absolute"
    zIndex="1"
    borderRadius="10px"
    w="50px"
    h="50px"
    bgColor="panda.yellowDark"
    {...props}
  />
)
