import Image from 'next/image'
import { css } from '../styled-system/css'
import { Container, Grid, HStack, Stack, panda } from '../styled-system/jsx'
import { Icon } from '../theme/icons'

const testimonials: Array<{
  text: string
  author: string
  username: string
  avatar: string
}> = [
  {
    author: 'Jess Truss',
    avatar:
      'https://images.unsplash.com/photo-1619895862022-09114b41f16f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8cHJvZmlsZSUyMHBob3RvfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60',
    text: 'Of all the libraries I’ve built design systems with: SC, emotion, xstyled, styled-system, theme-ui etc., @panda__css has been the most ergonomic and enjoyable. Took a look at the roadmap and it looks like it’s getting even better.',
    username: '@jess__truss'
  },
  {
    author: 'Dann',
    avatar:
      'https://images.unsplash.com/photo-1584673392125-f91e13c6a3cb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fHByb2ZpbGUlMjBwaG90b3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60',
    text: "Been using @panda__css for a week on an actual product and I've never had such a smooth collaboration, shared vocabulary, and mutual understanding with our designer. Setting up tokens and being very systematic and constrained about the UI we build has never been easier.",
    username: '@dan_best'
  },
  {
    author: 'Nabeel Ben',
    avatar:
      'https://images.unsplash.com/photo-1595085610896-fb31cfd5d4b7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDJ8fHByb2ZpbGUlMjBwaG90b3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60',
    text: 'I have been using @panda__css for a few weeks now and I am loving it. It is so easy to use and the documentation is great. I am using it with @reactjs and @typescript and it is a great combo.',
    username: '@nabeel_ben'
  }
]

export const SectionTestimonials = () => {
  return (
    <panda.section bg="bg.inverted">
      <Container pt="20" pb="32">
        <Icon
          icon="DoubleHeart"
          className={css({
            display: { base: 'none', sm: 'block' },
            w: '12rem',
            pos: 'absolute',
            top: '24',
            right: '8',
            color: 'yellow.300'
          })}
        />
        <panda.h3
          mt={{ base: '8', lg: '16' }}
          textStyle="panda.h3"
          fontWeight="bold"
          maxW={{ base: 'lg', lg: '2xl' }}
        >
          Tons of others love building and shipping sites with Panda.
        </panda.h3>

        <Grid columns={{ base: 1, lg: 3 }} gap="6" mt="20">
          {testimonials.map(testimonial => (
            <Stack gap="8" layerStyle="offShadow" rounded="xl" px="6" py="5">
              <HStack>
                <panda.div rounded="lg" w="12" h="12" overflow="hidden">
                  <Image
                    width="48"
                    height="48"
                    src={testimonial.avatar}
                    alt={testimonial.author}
                    style={{ objectFit: 'cover', height: '100%' }}
                  />
                </panda.div>

                <Stack gap="0">
                  <panda.span fontWeight="bold">
                    {testimonial.author}
                  </panda.span>
                  <span>{testimonial.username}</span>
                </Stack>
              </HStack>
              <div>{testimonial.text}</div>
            </Stack>
          ))}
        </Grid>
      </Container>
    </panda.section>
  )
}
