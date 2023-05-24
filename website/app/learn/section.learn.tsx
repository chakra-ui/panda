import Image from 'next/image'
import { Container, Grid, HStack, Stack, panda } from '../../styled-system/jsx'
import { input } from '../../styled-system/recipes'
import { Icon } from '../../theme/icons'
import { css } from '../../styled-system/css'

const featureItems = [
  {
    title: 'Getting started with Panda',
    description: 'Learn the fundamentals of Panda in 3 minutes.',
    image:
      'https://images.unsplash.com/photo-1523437113738-bbd3cc89fb19?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8Y3NzfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60',
    duration: '3m'
  },
  {
    title: 'Style props fundamentals',
    description: 'Learn the fundamentals of style props in 4 minutes.',
    image:
      'https://images.unsplash.com/photo-1593720219276-0b1eacd0aef4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8cmVhY3R8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60',
    duration: '4m'
  },
  {
    title: 'Building a design system',
    description: 'Learn how to build a design system in 8 minutes.',
    image:
      'https://images.unsplash.com/photo-1558655146-d09347e92766?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1364&q=80',
    duration: '8m'
  }
]

export const SectionLearn = () => {
  return (
    <panda.section bg="bg.main">
      <Container pt="40" pb="20">
        <HStack gap="14" mb={{ base: '10', md: '0' }}>
          <Stack gap="10" flex="1">
            <Stack gap="2">
              <panda.h1
                color="text.headline"
                textStyle="panda.h1"
                fontWeight="bold"
              >
                Learn.
              </panda.h1>
              <panda.p
                color="text.muted"
                textStyle="panda.h4"
                fontWeight="medium"
              >
                Tutorials, videos, and articles to get started with Panda.
              </panda.p>
            </Stack>

            <panda.div
              maxW={{ lg: '420px' }}
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
          </Stack>

          <Image
            src="/panda-scooter.svg"
            width={365}
            height={469}
            alt="Yums the panda driving a scooter"
            className={css({
              display: { base: 'none', lg: 'block' },
              position: 'relative',
              top: '10'
            })}
          />
        </HStack>

        <Grid
          columns={{ base: 1, lg: 3 }}
          layerStyle="offShadow"
          bg="bg.inverted"
          pt="16"
          pb="12"
          px="12"
          rounded="xl"
          gap="8"
        >
          {featureItems.map((item, index) => (
            <Stack key={index} gap="6">
              <panda.div
                w="100%"
                h="240px"
                bg="bg.main"
                borderRadius="xl"
                overflow="hidden"
              >
                <Image
                  width="380"
                  height="240"
                  style={{ objectFit: 'cover' }}
                  src={item.image}
                  alt=""
                />
              </panda.div>
              <Stack gap="0">
                <panda.span
                  textStyle="2xl"
                  fontWeight="bold"
                  letterSpacing="tight"
                >
                  {item.title}
                </panda.span>
                <panda.span
                  color="bg.muted"
                  fontWeight="medium"
                  letterSpacing="tight"
                >
                  {item.duration}
                </panda.span>
              </Stack>
            </Stack>
          ))}
        </Grid>
      </Container>
    </panda.section>
  )
}
