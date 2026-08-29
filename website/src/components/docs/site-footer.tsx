import { docsConfig } from '@/docs.config'
import { css } from '@/styled-system/css'
import { Box, Stack } from '@/styled-system/jsx'
import Link from 'next/link'
import { LuGithub, LuMessageCircle, LuTwitter } from 'react-icons/lu'

interface FooterLink {
  title: string
  href: string
}

interface FooterColumn {
  title: string
  links: FooterLink[]
}

export const footerColumns: FooterColumn[] = [
  {
    title: 'Learn',
    links: [
      { title: 'Documentation', href: '/docs' },
      { title: 'Reference', href: '/docs/reference/cli' },
      { title: 'Blog', href: '/blog' },
      { title: 'Install', href: '/docs/styling/installation' }
    ]
  },
  {
    title: 'Toolkit',
    links: [
      { title: 'ESLint & Oxlint', href: '/docs/tooling/eslint-oxlint-plugin' },
      { title: 'Editor & IDE', href: '/docs/tooling/editor-tooling' },
      { title: 'MCP server', href: '/docs/tooling/mcp-server' },
      { title: 'Studio', href: '/docs/tooling/studio' },
      { title: 'Playground', href: 'https://play.panda-css.com/' }
    ]
  },
  {
    title: 'Community',
    links: [
      { title: 'Discord', href: docsConfig.discordUrl },
      { title: 'GitHub', href: docsConfig.docsRepositoryBase },
      { title: 'X (Twitter)', href: docsConfig.twitterUrl },
      {
        title: 'Contributing',
        href: `${docsConfig.docsRepositoryBase}/blob/main/CONTRIBUTING.md`
      }
    ]
  },
  {
    title: 'Project',
    links: [
      { title: 'Showcase', href: '/showcase' },
      { title: 'Team', href: '/team' },
      { title: 'Roadmap', href: 'https://panda-css.canny.io/' },
      {
        title: 'Changelog',
        href: `${docsConfig.docsRepositoryBase}/blob/main/CHANGELOG.md`
      }
    ]
  }
]

const linkStyles = css({
  textStyle: 'sm',
  color: 'fg.muted',
  textDecoration: 'none',
  transitionProperty: 'color',
  transitionDuration: '150ms',
  _hover: { color: 'fg' }
})

const socials = [
  { icon: <LuGithub />, href: docsConfig.docsRepositoryBase, label: 'GitHub' },
  { icon: <LuMessageCircle />, href: docsConfig.discordUrl, label: 'Discord' },
  { icon: <LuTwitter />, href: docsConfig.twitterUrl, label: 'X' }
]

export const SiteFooter = () => {
  return (
    <Box as="footer" borderTopWidth="1px" borderColor="border" mt="24">
      <Box maxW="90rem" mx="auto" px="6" py="16">
        <Box
          display="grid"
          gap="10"
          gridTemplateColumns={{
            base: 'repeat(2, minmax(0, 1fr))',
            lg: '1.5fr repeat(4, minmax(0, 1fr))'
          }}
        >
          <Stack gap="4" gridColumn={{ base: '1 / -1', lg: 'auto' }}>
            <Box textStyle="xl" fontWeight="bold" letterSpacing="tight">
              panda
            </Box>
            <Box textStyle="sm" color="fg.muted" maxW="16rem" lineHeight="1.6">
              Build modern websites with build-time, type-safe CSS-in-JS.
            </Box>
            <Box display="flex" gap="3" color="fg.subtle">
              {socials.map(social => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={css({
                    p: '1',
                    transitionProperty: 'color',
                    transitionDuration: '150ms',
                    _hover: { color: 'fg' }
                  })}
                >
                  {social.icon}
                </a>
              ))}
            </Box>
          </Stack>

          {footerColumns.map(column => (
            <Stack key={column.title} gap="3">
              <Box textStyle="eyebrow" color="fg.subtle">
                {column.title}
              </Box>
              <Stack gap="2.5">
                {column.links.map(link => {
                  const external = link.href.startsWith('http')
                  return external ? (
                    <a
                      key={link.title}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={linkStyles}
                    >
                      {link.title}
                    </a>
                  ) : (
                    <Link
                      key={link.title}
                      href={link.href}
                      className={linkStyles}
                    >
                      {link.title}
                    </Link>
                  )
                })}
              </Stack>
            </Stack>
          ))}
        </Box>

        <Box
          mt="14"
          pt="6"
          borderTopWidth="1px"
          borderColor="border"
          textStyle="sm"
          color="fg.subtle"
          display="flex"
          flexWrap="wrap"
          gap="4"
          justifyContent="space-between"
        >
          <span>Copyright © {new Date().getFullYear()}</span>
          <a
            href="https://www.adebayosegun.com/"
            className={css({
              color: 'inherit',
              textDecoration: 'none',
              _hover: { color: 'fg' }
            })}
          >
            Proudly made by the Chakra team
          </a>
        </Box>
      </Box>
    </Box>
  )
}
