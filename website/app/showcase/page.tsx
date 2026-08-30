import { SitePage } from '@/components/site-page'
import { generateOgImageUrl } from '@/lib/og-image'
import { showcases, type Showcase } from '@/showcase'
import { css } from '@/styled-system/css'
import { textLink } from '@/styled-system/recipes'
import { Box } from '@/styled-system/jsx'
import type { Metadata } from 'next'
import Image from 'next/image'
import { LuArrowUpRight } from 'react-icons/lu'

const title = 'Built with Panda'
const description = 'Real products shipping on Panda CSS today.'

export const metadata: Metadata = {
  title: 'Showcase | Panda CSS',
  description,
  openGraph: {
    title,
    description,
    images: [generateOgImageUrl({ title, description, category: 'Showcase' })]
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [generateOgImageUrl({ title, description, category: 'Showcase' })]
  }
}

const mediaCover = css({ objectFit: 'cover' })
const mediaTall = css({ aspectRatio: '3 / 2' })

const cardStyles = css({
  display: 'flex',
  flexDirection: 'column',
  borderWidth: '1px',
  borderColor: 'border',
  rounded: 'lg',
  overflow: 'hidden',
  textDecoration: 'none',
  color: 'fg',
  transitionProperty: 'border-color, background-color',
  transitionDuration: '150ms',
  _hover: { borderColor: 'fg.subtle', bg: 'bg.subtle' }
})

function ShowcaseCard(props: { data: Showcase }) {
  const { data } = props

  return (
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cardStyles}
    >
      <Box
        position="relative"
        w="full"
        bg="bg.subtle"
        overflow="hidden"
        className={mediaTall}
      >
        <Image
          src={data.image}
          alt={`The ${data.name} website, built with Panda CSS`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className={mediaCover}
        />
      </Box>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        gap="4"
        px="5"
        py="4"
        borderTopWidth="1px"
        borderColor="border"
      >
        <Box minW="0">
          <Box textStyle="sm" fontWeight="semibold">
            {data.name}
          </Box>
          <Box textStyle="eyebrow" color="fg.subtle" mt="1.5">
            {data.description}
          </Box>
        </Box>
        <Box color="fg.subtle" flexShrink="0">
          <LuArrowUpRight />
        </Box>
      </Box>
    </a>
  )
}

export default function ShowcasePage() {
  return (
    <SitePage kicker="Built with Panda" title={title} description={description}>
      <Box
        display="grid"
        gridTemplateColumns={{ base: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' }}
        gap="5"
      >
        {showcases.map(item => (
          <ShowcaseCard key={item.name} data={item} />
        ))}
      </Box>

      <Box
        mt="16"
        pt="10"
        borderTopWidth="1px"
        borderColor="border"
        textStyle="prose"
        color="fg.muted"
      >
        Shipping something on Panda?{' '}
        <a
          href="https://github.com/chakra-ui/panda/discussions/1182"
          target="_blank"
          rel="noopener noreferrer"
          className={textLink()}
        >
          Tell us about it
        </a>
        .
      </Box>
    </SitePage>
  )
}
