import { css } from '../styled-system/css'
import { Flex, HTMLPandaProps, panda } from '../styled-system/jsx'
import { button } from '../styled-system/recipes'
import { Icon } from '../theme/icons'
import { Content } from './content'

export const SectionTestimonials = () => {
  return (
    <Flex
      bgColor="panda.bg.inverted"
      justifyContent="center"
      pt={{ base: '40px', lg: '145px' }}
      pb={{ base: '40px', lg: '90px' }}
    >
      <Content pos="relative">
        <Icon
          icon="DoubleHeart"
          className={css({
            w: '173px',
            h: '166px',
            pos: 'absolute',
            top: 0,
            right: 0,
            color: 'panda.yellow',
            opacity: { base: 0.4, md: 0.6, lg: 1 }
          })}
        />
        <panda.h3
          position="relative"
          textStyle="panda.h3"
          mt={{ base: '20px', lg: '53px' }}
          maxW={{ lg: '55%' }}
        >
          Tons of others love building and shipping sites with Panda.
        </panda.h3>
        <Flex
          gap="30px"
          mt="95px"
          flexDirection={{ base: 'column', lg: 'row' }}
        >
          <Testimonial>
            <Flex>
              {/* TODO avatar img */}
              <TestimonialAvatar bgColor="panda.bg.main" />
              <TestimonialAuthor>
                <span>Alex Truss</span>
                <panda.span color={{ base: '#7D7D7D', _dark: '#ABABAB' }}>
                  @alextruss_dev
                </panda.span>
              </TestimonialAuthor>
            </Flex>
            <TestimonialText>
              Of all the libraries I’ve built design systems with: SC, emotion,
              xstyled, styled-system, theme-ui etc., @panda_css has been the
              most ergonomic and enjoyable. Took a look at the roadmap and it
              looks like it’s getting even better.
            </TestimonialText>
          </Testimonial>
          <Testimonial>
            <Flex>
              {/* TODO avatar img */}
              <TestimonialAvatar bgColor="panda.bg.main" />
              <TestimonialAuthor>
                <span>Dann</span>
                <panda.span color={{ base: '#7D7D7D', _dark: '#ABABAB' }}>
                  @dan_best
                </panda.span>
              </TestimonialAuthor>
            </Flex>
            <TestimonialText>
              Been using @panda_css for a week on an actual product and I've
              never had such a smooth collaboration, shared vocabulary, and
              mutual understanding with our designer. Setting up tokens and
              being very systematic and constrained about the UI we build has
              never been easier.
            </TestimonialText>
          </Testimonial>
          <Testimonial>
            <Flex>
              {/* TODO avatar img */}
              <TestimonialAvatar bgColor="panda.bg.main" />
              <TestimonialAuthor>
                <span>Nabeel Ben</span>
                <panda.span color={{ base: '#7D7D7D', _dark: '#ABABAB' }}>
                  @nabbs
                </panda.span>
              </TestimonialAuthor>
            </Flex>
            <TestimonialText>
              I haven't been much of a fan of js object syntax for css in the
              past, but I've been trying out @stitchesjs on a side project and
              it's quite fun so far.The performance promises and type-hinting
              make it really appealing right away. Good docs as well.
            </TestimonialText>
          </Testimonial>
        </Flex>
      </Content>
    </Flex>
  )
}

const Testimonial = ({ children }) => {
  return (
    <panda.div
      display="flex"
      flexDirection="column"
      alignItems="flex-start"
      justifyContent="center"
      className={button({ color: 'border' })}
    >
      {children}
    </panda.div>
  )
}

const TestimonialAvatar = (props: HTMLPandaProps<'div'>) => {
  return (
    <panda.div borderRadius="10px" w="45px" h="45px" mr="17px" {...props} />
  )
}

const TestimonialAuthor = ({ children }) => {
  return (
    <Flex
      direction="column"
      fontSize="1.0625rem"
      lineHeight="1.4375rem"
      letterSpacing="tight"
      fontWeight="500"
      mb="20px"
    >
      {children}
    </Flex>
  )
}

const TestimonialText = ({ children }) => {
  return (
    <panda.span
      fontSize="1.0625rem"
      lineHeight="1.5625rem"
      letterSpacing="tight"
      fontWeight="600"
    >
      {children}
    </panda.span>
  )
}
