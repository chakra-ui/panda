import { SitePage } from '@/components/site-page'
import { teamMembers } from '@/docs.config'
import { fetchGithubUsers, type GitHubUser } from '@/lib/github-utils'
import { generateOgImageUrl } from '@/lib/og-image'
import { css } from '@/styled-system/css'
import { textLink } from '@/styled-system/recipes'
import { Box } from '@/styled-system/jsx'
import type { Metadata } from 'next'
import Image from 'next/image'
import { LuGithub, LuGlobe, LuTwitter } from 'react-icons/lu'

const title = 'Team'
const description =
  'Panda is built by a small core team and a large community of contributors.'

export const metadata: Metadata = {
  title: `${title} | Panda CSS`,
  description,
  openGraph: {
    title,
    description,
    images: [generateOgImageUrl({ title, description, category: 'Team' })]
  }
}

function toAbsoluteUrl(value: string) {
  return /^https?:\/\//.test(value) ? value : `https://${value}`
}

const socialStyles = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '8',
  h: '8',
  rounded: 'md',
  color: 'fg.subtle',
  transitionProperty: 'color, background-color',
  transitionDuration: '150ms',
  _hover: { color: 'fg', bg: 'bg.muted' }
})

function MemberRow({ user }: { user: GitHubUser }) {
  const role =
    teamMembers.find(member => member.login === user.login)?.role ??
    'Contributor'

  return (
    <Box
      display="grid"
      gridTemplateColumns={{ base: 'auto 1fr', md: 'auto 1fr auto' }}
      alignItems="center"
      gap={{ base: '4', md: '6' }}
      py="5"
      borderTopWidth="1px"
      borderColor="border"
    >
      <Image
        src={user.avatar_url}
        alt=""
        width={48}
        height={48}
        className={css({ rounded: 'full', w: '12', h: '12' })}
      />

      <Box minW="0">
        <Box textStyle="lg" fontWeight="semibold">
          {user.name || user.login}
        </Box>
        <Box textStyle="eyebrow" color="fg.subtle" mt="1.5">
          {role}
        </Box>
      </Box>

      <Box display="flex" gap="1" gridColumn={{ base: '2', md: 'auto' }}>
        <a
          href={user.html_url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${user.login} on GitHub`}
          className={socialStyles}
        >
          <LuGithub />
        </a>
        {user.twitter_username && (
          <a
            href={`https://x.com/${user.twitter_username}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${user.login} on X`}
            className={socialStyles}
          >
            <LuTwitter />
          </a>
        )}
        {user.blog && (
          <a
            href={toAbsoluteUrl(user.blog)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${user.login}'s website`}
            className={socialStyles}
          >
            <LuGlobe />
          </a>
        )}
      </Box>
    </Box>
  )
}

export default async function TeamPage() {
  const users = await fetchGithubUsers(teamMembers.map(member => member.login))

  return (
    <SitePage kicker="Maintainers" title={title} description={description}>
      <Box borderBottomWidth="1px" borderColor="border">
        {users.map(user => (
          <MemberRow key={user.login} user={user} />
        ))}
      </Box>

      <Box
        mt="16"
        pt="10"
        borderTopWidth="1px"
        borderColor="border"
        textStyle="prose"
        color="fg.muted"
        maxW="42rem"
      >
        Panda also carries work from hundreds of contributors.{' '}
        <a
          href="https://github.com/chakra-ui/panda/blob/main/CONTRIBUTING.md"
          target="_blank"
          rel="noopener noreferrer"
          className={textLink()}
        >
          Contribute
        </a>
        .
      </Box>
    </SitePage>
  )
}
