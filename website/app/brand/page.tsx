import { SitePage } from '@/components/site-page'
import { generateOgImageUrl } from '@/lib/og-image'
import { css } from '@/styled-system/css'
import { Box } from '@/styled-system/jsx'
import type { Metadata } from 'next'
import Image from 'next/image'

const title = 'Brand kit'
const description =
  'The Panda logo, wordmark and palette. Please do not stretch, recolour or restyle the panda without asking.'

export const metadata: Metadata = {
  title: `${title} | Panda CSS`,
  description,
  openGraph: {
    title,
    description,
    images: [generateOgImageUrl({ title, description, category: 'Brand' })]
  }
}

const assets = [
  {
    name: 'Logo',
    file: 'panda-p-letter.svg',
    src: '/static/panda-p-letter.svg'
  },
  { name: 'Mascot', file: 'panda-hello.svg', src: '/static/panda-hello.svg' },
  { name: 'Rocket', file: 'panda-rocket.svg', src: '/static/panda-rocket.svg' }
]

const colors = [
  { name: 'Yellow', hex: '#FACC15', swatch: 'yellow.400' },
  { name: 'Ink', hex: '#0D0D0D', swatch: 'black' },
  { name: 'Wash', hex: '#FEF9C3', swatch: 'yellow.100' },
  { name: 'Paper', hex: '#FFFFFF', swatch: 'white' }
]

const cellStyles = css({
  borderWidth: '1px',
  borderColor: 'border',
  marginBlockStart: '-1px',
  marginInlineStart: '-1px',
  overflow: 'hidden'
})

export default function BrandPage() {
  return (
    <SitePage kicker="Brand" title={title} description={description}>
      <Box
        display="grid"
        gridTemplateColumns={{ base: '1fr', md: 'repeat(3, minmax(0, 1fr))' }}
        mt="4"
      >
        {assets.map(asset => (
          <Box key={asset.name} className={cellStyles}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              h="16rem"
              p="10"
              bg="bg.subtle"
            >
              <Image
                src={asset.src}
                alt={`Panda ${asset.name.toLowerCase()}`}
                width={160}
                height={160}
                style={{ maxHeight: '100%', width: 'auto' }}
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
              <Box textStyle="sm" fontWeight="medium">
                {asset.name}
              </Box>
              <a
                href={asset.src}
                download
                className={css({
                  textStyle: 'sm',
                  fontFamily: 'mono',
                  color: 'fg.muted',
                  textDecorationLine: 'underline',
                  textUnderlineOffset: '3px',
                  _hover: { color: 'fg' }
                })}
              >
                {asset.file}
              </a>
            </Box>
          </Box>
        ))}
      </Box>

      <Box
        as="h2"
        fontSize="3xl"
        fontWeight="bold"
        letterSpacing="tight"
        mt="16"
        mb="6"
      >
        Colours
      </Box>

      <Box
        display="grid"
        gridTemplateColumns={{ base: '1fr', sm: 'repeat(4, minmax(0, 1fr))' }}
      >
        {colors.map(color => (
          <Box key={color.name} className={cellStyles}>
            <Box h="9rem" bg={color.swatch} />
            <Box px="5" py="4" borderTopWidth="1px" borderColor="border">
              <Box textStyle="sm" fontWeight="medium">
                {color.name}
              </Box>
              <Box textStyle="sm" fontFamily="mono" color="fg.subtle">
                {color.hex}
              </Box>
            </Box>
          </Box>
        ))}
      </Box>

      <Box
        as="h2"
        fontSize="3xl"
        fontWeight="bold"
        letterSpacing="tight"
        mt="16"
        mb="4"
      >
        Using the name
      </Box>
      <Box textStyle="prose" color="fg.muted" maxW="42rem">
        Write it <strong>Panda CSS</strong> on first mention and{' '}
        <strong>Panda</strong> after that. The package scope is{' '}
        <code>@pandacss</code>, lowercase. Do not write PandaCSS, panda.css or
        Panda-CSS.
      </Box>
    </SitePage>
  )
}
