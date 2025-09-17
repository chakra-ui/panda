import { Navbar } from '@/components/navbar'
import { generateOgImageUrl } from '@/lib/og-image'
import { css } from '@/styled-system/css'
import { Container, Grid, HStack, panda, Stack } from '@/styled-system/jsx'
import { FooterSection } from '@/www/footer.section'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { showcases } from '@/showcase'

const ogTitle = 'See projects built with Panda CSS'
const ogDescription =
  'Explore the projects and applications built using Panda CSS'

export const metadata: Metadata = {
  title: 'Showcase',
  description:
    'Panda CSS is a powerful tool for building modern web applications.',
  openGraph: {
    title: ogTitle,
    description: ogDescription,
    type: 'website',
    images: [
      generateOgImageUrl({
        title: ogTitle,
        description: ogDescription,
        category: 'Showcase'
      })
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: ogTitle,
    description: ogDescription,
    images: [
      generateOgImageUrl({
        title: ogTitle,
        description: ogDescription,
        category: 'Showcase'
      })
    ]
  }
}

interface Showcase {
  name: string
  description: string
  url: string
  image: string
}

const cardStyles = css({
  borderWidth: '1px',
  borderRadius: 'md',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  transition: 'transform 0.2s',
  _hover: {
    transform: 'translateY(-4px)',
    shadow: 'lg'
  }
})

const ShowcaseCard = ({ data }: { data: Showcase }) => {
  const { name, description, url, image } = data

  return (
    <Link
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cardStyles}
    >
      <Image
        src={image}
        alt={name}
        width={400}
        height={300}
        className={css({
          width: '100%',
          height: '200px',
          objectFit: 'cover',
          borderTopRadius: 'md'
        })}
      />
      <Stack p="4" gap="2" bg="bg">
        <panda.h3 fontSize="lg" fontWeight="semibold">
          {name}
        </panda.h3>
        <panda.p fontSize="md" color="fg.muted">
          {description}
        </panda.p>
      </Stack>
    </Link>
  )
}

export default function ShowcasePage() {
  return (
    <>
      <Navbar />
      <panda.div bg="bg.muted" pt="20" minH="80dvh">
        <Container py="20">
          <Stack gap="6" align="center">
            <Stack align="center" textAlign="center">
              <panda.h1
                fontSize={{ base: '3xl', md: '5xl' }}
                fontWeight="bold"
                letterSpacing="tight"
              >
                Showcase
              </panda.h1>
            </Stack>
            <panda.p
              fontSize={{ base: 'lg', md: 'xl' }}
              color="fg.muted"
              maxW="2xl"
              lineHeight="relaxed"
              textAlign="center"
            >
              Explore the projects built with Panda CSS by the community and get
              inspired for your next project.
            </panda.p>
          </Stack>
        </Container>

        <Container pb="20">
          <Grid
            columns={{ base: 1, md: 2, lg: 3 }}
            gap={{ base: '4', md: '8' }}
          >
            {showcases.map(showcase => (
              <ShowcaseCard key={showcase.name} data={showcase} />
            ))}
          </Grid>
        </Container>
      </panda.div>
      <FooterSection />
    </>
  )
}
