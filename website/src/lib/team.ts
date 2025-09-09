export interface GitHubUser {
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

export const ROLE_MAPPING = new Map([
  ['segunadebayo', 'Creator & Maintainer'],
  ['astahmer', 'Creator'],
  ['cschroeter', 'Creator @ Park UI'],
  ['anubra266', 'Creator @ Tark UI'],
  ['estheragbaje', 'Developer Marketing']
])

export async function fetchGitHubUser(username: string): Promise<GitHubUser | null> {
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

export async function fetchTeamMembers(): Promise<GitHubUser[]> {
  const userPromises = Array.from(ROLE_MAPPING.keys()).map(username =>
    fetchGitHubUser(username)
  )
  const users = await Promise.all(userPromises)
  return users.filter((user): user is GitHubUser => user !== null)
}