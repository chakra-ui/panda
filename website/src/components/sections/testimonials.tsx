import { css } from '@/styled-system/css'
import { Container, Grid, HStack, Stack, panda } from '@/styled-system/jsx'
import { Icon } from '@/theme/icons'
import Image from 'next/image'

const testimonials: Array<{
  text: string
  author: string
  username: string
  avatar: string
}> = [
  {
    author: 'Alex S.',
    avatar: '/profiles/alex-s.png',
    text: 'Working with Panda CSS has been a delightful experience. The seamless styling it offers is impressive, providing a native CSS-like experience but with added benefits like typesafety, JIT styles, and recipe variants. Plus, you can use it anywhere!',
    username: '@astahmer_dev'
  },
  {
    author: 'Abraham A.',
    avatar: '/profiles/anubra.png',
    text: "🐼 Excited to share my love for @panda_css! It's revolutionized my styling process by seamlessly integrating CSS in JS without any runtime overhead. Say goodbye to complexity and hello to efficiency! 🎨 Highly recommend trying it out!",
    username: '@anubra266'
  },
  {
    author: 'Ivica B.',
    avatar: '/profiles/ivica-b.png',
    text: 'Panda CSS has completely transformed the way I approach styling in my projects. By harnessing the remarkable performance benefits of Utility Classes and the ease of use that CSS-in-JS provides, I experience a significant enhancement in readability and DX. It’s like having the best of both worlds in a single styling engine.',
    username: '@ivica'
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
            <Stack
              gap="8"
              layerStyle="offShadow"
              shadowColor={{ base: 'black', _dark: 'yellow.300' }}
              rounded="xl"
              px="6"
              py="5"
            >
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
