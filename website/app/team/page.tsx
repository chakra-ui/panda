import { css } from '@/styled-system/css'
import { Container, Grid, HStack, panda, Stack } from '@/styled-system/jsx'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { FaGithub, FaGlobe, FaTwitter } from 'react-icons/fa'

export const metadata: Metadata = {
  title: 'Team',
  description: 'Meet the passionate developers and designers who make Panda CSS possible. Get to know the core team behind the modern CSS-in-JS framework.',
  openGraph: {
    title: 'Meet the Panda CSS Team',
    description: 'Meet the passionate developers and designers who make Panda CSS possible. Get to know the core team behind the modern CSS-in-JS framework.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Meet the Panda CSS Team',
    description: 'Meet the passionate developers and designers who make Panda CSS possible. Get to know the core team behind the modern CSS-in-JS framework.',
  }
}

interface GitHubUser {
  login: string
  name: string | null
  avatar_url: string
  bio: string | null
  company: string | null
  blog: string | null
  twitter_username: string | null
  public_repos: number
  followers: number
  html_url: string
}

const ROLE_MAPPING = new Map([
  ['segunadebayo', 'Creator & Maintainer'],
  ['astahmer', 'Creator'],
  ['cschroeter', 'Creator @ Park UI'],
  ['anubra266', 'Creator @ Tark UI'],
  ['estheragbaje', 'Developer Marketing']
])

async function fetchGitHubUser(username: string): Promise<GitHubUser | null> {
  try {
    const response = await fetch(`https://api.github.com/users/${username}`, {
      next: { revalidate: 3600 } // Revalidate every hour
    })
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error(`Failed to fetch GitHub user ${username}:`, error)
    return null
  }
}

async function fetchTeamMembers(): Promise<GitHubUser[]> {
  const userPromises = Array.from(ROLE_MAPPING.keys()).map(username =>
    fetchGitHubUser(username)
  )
  const users = await Promise.all(userPromises)
  return users.filter((user): user is GitHubUser => user !== null)
}

const iconMap = {
  github: <FaGithub />,
  twitter: <FaTwitter />,
  blog: <FaGlobe />
}

const SocialIcon = ({ platform, url }: { platform: string; url: string }) => {
  return (
    <Link
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={css({
        color: 'var(--fg-muted)',
        transition: 'color 0.2s'
      })}
      aria-label={`${platform} profile`}
    >
      {iconMap[platform as keyof typeof iconMap] || (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
        </svg>
      )}
    </Link>
  )
}

const TeamMemberCard = ({ member }: { member: GitHubUser }) => {
  const role = ROLE_MAPPING.get(member.login) || 'Contributor'

  return (
    <panda.div
      bg="white"
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
      borderRadius="xl"
      p="8"
      textAlign="center"
      boxShadow="sm"
      transition="transform 0.2s"
      _hover={{
        transform: 'translateY(-4px)',
        shadow: 'lg'
      }}
    >
      <Stack gap="6" align="center" pt="4">
        <panda.div
          position="relative"
          w="20"
          h="20"
          borderRadius="full"
          overflow="hidden"
          outline="4px solid"
          outlineColor="yellow.300"
          outlineOffset="4px"
        >
          <Image
            src={member.avatar_url}
            alt={member.name || member.login}
            width={80}
            height={80}
            className={css({
              objectFit: 'cover',
              width: '100%',
              height: '100%'
            })}
          />
        </panda.div>

        <Stack gap="1" align="center">
          <panda.h3 fontSize="xl" fontWeight="bold">
            {member.name || member.login}
          </panda.h3>

          <panda.p textStyle="ms" color="var(--fg-muted)">
            {role}
          </panda.p>
        </Stack>

        <panda.p fontSize="sm">
          {member.bio || 'Contributing to the Panda CSS ecosystem'}
        </panda.p>

        <HStack gap="4" justify="center">
          <SocialIcon platform="github" url={member.html_url} />
          {member.twitter_username && (
            <SocialIcon
              platform="twitter"
              url={`https://twitter.com/${member.twitter_username}`}
            />
          )}
          {member.blog && (
            <SocialIcon platform="blog" url={toHttps(member.blog)} />
          )}
        </HStack>
      </Stack>
    </panda.div>
  )
}

const toHttps = (url: string) => {
  return url.startsWith('https://') ? url : `https://${url}`
}

export default async function TeamPage() {
  const teamMembers = await fetchTeamMembers()

  return (
    <panda.div
      bg="gray.50"
      pt="20"
      _dark={{ bg: 'gray.900' }}
      minH="100vh"
      css={{
        '--fg-muted': { base: '{colors.gray.600}', _dark: '{colors.gray.400}' }
      }}
    >
      <Container py="20">
        <Stack gap="16" align="center">
          <Stack gap="6" align="center" textAlign="center">
            <panda.h1
              fontSize={{ base: '3xl', md: '5xl' }}
              fontWeight="bold"
              letterSpacing="tight"
            >
              Meet our team
            </panda.h1>
            <panda.p
              fontSize={{ base: 'lg', md: 'xl' }}
              color="var(--fg-muted)"
              maxW="2xl"
              lineHeight="relaxed"
            >
              The passionate developers and designers who make Panda CSS
              possible.
            </panda.p>
          </Stack>

          <Grid columns={{ base: 1, md: 2, lg: 3 }} gap="8" w="full" maxW="6xl">
            {teamMembers.length > 0 ? (
              teamMembers.map(member => (
                <TeamMemberCard key={member.login} member={member} />
              ))
            ) : (
              <panda.div
                gridColumn="1 / -1"
                textAlign="center"
                p="8"
                color="gray.500"
              >
                Unable to load team members
              </panda.div>
            )}
          </Grid>
        </Stack>
      </Container>
    </panda.div>
  )
}
