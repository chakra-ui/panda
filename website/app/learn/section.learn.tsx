import Image from 'next/image'
import { Flex, Grid, Stack, panda } from '../../styled-system/jsx'
import { button, input } from '../../styled-system/recipes'
import { css } from '../../styled-system/css'
import { Icon } from '../../theme/icons'

export const SectionLearn = () => {
  return (
    <panda.div backgroundColor="panda.bg.main" px="48px">
      <Flex direction="column">
        <Flex position="relative">
          <Flex direction="column" w="60%" pt="275px" pb="70px">
            <panda.h1
              ml="-3.5"
              color="panda.text.headline"
              fontSize="14.5rem"
              lineHeight="11.875rem"
              letterSpacing="tighter"
              fontWeight="bold"
            >
              Learn.
            </panda.h1>
            <panda.h2
              mt="15px"
              color="panda.text.muted"
              fontSize="26px"
              lineHeight="34px"
              letterSpacing="tight"
              fontWeight="medium"
            >
              Tutorials, videos, and articles to get started with Panda.
            </panda.h2>
            <panda.div
              mt="45px"
              maxW="450px"
              className={input({ color: 'white' })}
            >
              <Icon
                data-scope="input"
                data-part="left-icon"
                icon="MagnifyingGlass"
              />
              <input
                data-scope="input"
                data-part="input"
                type="search"
                placeholder="Search articles and videos"
              />
            </panda.div>
          </Flex>
          <Image
            src="/panda-scooter.svg"
            width={365}
            height={469}
            alt="Yums the panda driving a scooter"
            className={css({
              ml: '120px',
              zIndex: 1,
              position: 'absolute',
              bottom: -37,
              left: '60%'
            })}
          />
        </Flex>
        <Grid
          pt="70px"
          pb="50px"
          px="60px"
          className={button()}
          backgroundColor="white"
          color="black"
          columnGap="30px!"
          position="relative"
          mb="-260px"
          justifyContent="space-between"
          columns={3}
        >
          <Flex direction="column">
            <Thumbnail />
            <Stack textStyle="2xl" mt="25px">
              <panda.span fontWeight="bold" letterSpacing="tight">
                Getting started with Panda
              </panda.span>
              <panda.span
                color="panda.bg.muted"
                fontWeight="semibold"
                letterSpacing="tight"
              >
                3m
              </panda.span>
            </Stack>
          </Flex>
          <Flex direction="column">
            <Thumbnail />
            <Stack textStyle="2xl" mt="25px">
              <panda.span fontWeight="bold" letterSpacing="tight">
                Style props fundamentals
              </panda.span>
              <panda.span
                color="panda.bg.muted"
                fontWeight="semibold"
                letterSpacing="tight"
              >
                4m
              </panda.span>
            </Stack>
          </Flex>
          <Flex direction="column">
            <Thumbnail />
            <Stack textStyle="2xl" mt="25px">
              <panda.span fontWeight="bold" letterSpacing="tight">
                Building a design system
              </panda.span>
              <panda.span
                color="panda.bg.muted"
                fontWeight="semibold"
                letterSpacing="tight"
              >
                8m
              </panda.span>
            </Stack>
          </Flex>
        </Grid>
      </Flex>
    </panda.div>
  )
}

const Thumbnail = props => {
  return (
    <Flex
      w="100%"
      h="240px"
      bgColor="panda.bg.main"
      borderRadius="18px"
      {...props}
    />
  )
}
