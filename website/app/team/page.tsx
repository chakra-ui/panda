import { Navbar } from '@/components/navbar'
import { teamMembers } from '@/docs.config'
import { fetchGitHubUser, type GitHubUser } from '@/lib/team'
import { css } from '@/styled-system/css'
import { Container, Grid, HStack, panda, Stack } from '@/styled-system/jsx'
import { FooterSection } from '@/www/footer.section'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { FaGithub, FaGlobe, FaTwitter } from 'react-icons/fa'

export const metadata: Metadata = {
  title: 'Team',
  description:
    'Panda CSS is maintained by a passionate team of engineers. It also receives contributions from engineers around the world.',
  openGraph: {
    title: 'Meet the passionate engineers who make Panda CSS possible',
    description:
      'Panda CSS is maintained by a passionate team of engineers. It also receives contributions from engineers around the world.',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Meet the Panda CSS Team',
    description:
      'Meet the passionate developers and designers who make Panda CSS possible. Get to know the core team behind the modern CSS-in-JS framework.'
  }
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
  const teamMember = teamMembers.find(tm => tm.login === member.login)
  const role = teamMember?.role || 'Contributor'

  return (
    <panda.div
      bg="bg"
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
  const userPromises = teamMembers.map(member => fetchGitHubUser(member.login))
  const users = await Promise.all(userPromises)
  const teamMembersWithDetails = users.filter(
    (user): user is GitHubUser => user !== null
  )

  return (
    <>
      <Navbar />
      <panda.div bg="bg.muted" pt="20" minH="80dvh">
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
                color="fg.muted"
                maxW="2xl"
                lineHeight="relaxed"
              >
                Panda CSS is maintained by a passionate team of engineers. It
                also receives contributions from engineers around the world.
              </panda.p>
            </Stack>

            <Grid
              columns={{ base: 1, md: 2, lg: 3 }}
              gap="8"
              w="full"
              maxW="6xl"
            >
              {teamMembersWithDetails.length > 0 ? (
                teamMembersWithDetails.map(member => (
                  <TeamMemberCard key={member.login} member={member} />
                ))
              ) : (
                <panda.div
                  gridColumn="1 / -1"
                  textAlign="center"
                  p="8"
                  color="fg.muted"
                >
                  Unable to load team members
                </panda.div>
              )}
            </Grid>
          </Stack>
        </Container>
      </panda.div>
      <FooterSection />
    </>
  )
}
