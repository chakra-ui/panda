import { DocsNavbar } from '@/components/docs/docs-navbar'
import { SiteFooter } from '@/components/docs/site-footer'
import { css } from '@/styled-system/css'
import { Box, Stack } from '@/styled-system/jsx'

interface Props {
  kicker: string
  title: string
  description?: string
  centered?: boolean
  children: React.ReactNode
}

export function SitePage(props: Props) {
  const { kicker, title, description, centered, children } = props

  return (
    <div
      className={css({
        '--navbar-height': '4rem',
        '--banner-height': '2.5rem'
      })}
    >
      <DocsNavbar />
      <main
        className={css({
          pt: 'calc(var(--navbar-height) + var(--banner-height))'
        })}
      >
        <Box maxW="72rem" mx="auto" px="6" pt="16" pb="24">
          <Stack
            gap="4"
            mb="14"
            alignItems={centered ? 'center' : 'flex-start'}
            textAlign={centered ? 'center' : 'start'}
          >
            <Box textStyle="eyebrow" color="fg.subtle">
              {kicker}
            </Box>
            <Box
              as="h1"
              fontSize={{ base: '4xl', md: '5xl' }}
              fontWeight="bold"
              letterSpacing="tighter"
              lineHeight="1.05"
            >
              {title}
            </Box>
            {description && (
              <Box
                textStyle="lg"
                color="fg.muted"
                maxW="42rem"
                lineHeight="1.6"
              >
                {description}
              </Box>
            )}
          </Stack>
          {children}
        </Box>
      </main>
      <SiteFooter />
    </div>
  )
}
