import Image from 'next/image'
import { Flex, Grid, Stack, panda } from '../../styled-system/jsx'
import { button, input } from '../../styled-system/recipes'
import { css } from '../../styled-system/css'
import { Icon } from '../../theme/icons'
import { Content } from '../content'

export const SectionLearn = () => {
  return (
    <panda.div bg="bg.main" px={{ base: '10px', lg: '48px' }}>
      <Content m="auto">
        <Flex position="relative">
          <Flex
            direction="column"
            w={{ lg: '60%' }}
            pt={{ base: '145px', md: '200px', lg: '275px' }}
            pb="70px"
          >
            <panda.h1
              ml={{ base: '-2', md: '-3.5' }}
              color="text.headline"
              textStyle="panda.h1"
            >
              Learn.
            </panda.h1>
            <panda.h4 mt="15px" color="text.muted" textStyle="panda.h4">
              Tutorials, videos, and articles to get started with Panda.
            </panda.h4>
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
              zIndex: 1,
              position: 'absolute',
              bottom: -37,
              right: '-20px',
              width: '70px',
              md: {
                width: '250px',
                ml: '50px',
                left: '60%',
                right: 'unset'
              },
              lg: {
                width: '250px',
                left: '55%'
              },
              xl: {
                width: '365px',
                ml: '120px',
                left: '60%'
              }
            })}
          />
        </Flex>
        <Grid
          pt={{ base: '25px', lg: '70px' }}
          pb={{ base: '15px', lg: '50px' }}
          px={{ base: '20px', md: '60px' }}
          className={button()}
          bg="white"
          color="black"
          columnGap="30px!"
          position="relative"
          mb="-260px"
          justifyContent="space-between"
          alignItems="flex-start"
          columns={{ base: 1, md: 3 }}
        >
          <Flex direction="column">
            <Thumbnail />
            <Stack textStyle="2xl" mt="6">
              <panda.span fontWeight="bold" letterSpacing="tight">
                Getting started with Panda
              </panda.span>
              <panda.span
                color="bg.muted"
                fontWeight="semibold"
                letterSpacing="tight"
              >
                3m
              </panda.span>
            </Stack>
          </Flex>
          <Flex direction="column">
            <Thumbnail />
            <Stack textStyle="2xl" mt="6">
              <panda.span fontWeight="bold" letterSpacing="tight">
                Style props fundamentals
              </panda.span>
              <panda.span
                color="bg.muted"
                fontWeight="semibold"
                letterSpacing="tight"
              >
                4m
              </panda.span>
            </Stack>
          </Flex>
          <Flex direction="column">
            <Thumbnail />
            <Stack textStyle="2xl" mt="6">
              <panda.span fontWeight="bold" letterSpacing="tight">
                Building a design system
              </panda.span>
              <panda.span
                color="bg.muted"
                fontWeight="semibold"
                letterSpacing="tight"
              >
                8m
              </panda.span>
            </Stack>
          </Flex>
        </Grid>
      </Content>
    </panda.div>
  )
}

const Thumbnail = props => {
  return <Flex w="100%" h="240px" bg="bg.main" borderRadius="18px" {...props} />
}
