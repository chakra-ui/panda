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

export async function fetchGitHubUser(
  username: string
): Promise<GitHubUser | null> {
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

export async function fetchGithubUsers(
  usernames: string[]
): Promise<GitHubUser[]> {
  const userPromises = usernames.map(username => fetchGitHubUser(username))
  const users = await Promise.all(userPromises)
  return users.filter((user): user is GitHubUser => user !== null)
}

export interface Contributor {
  login: string
  avatar_url: string
  html_url: string
  contributions: number
}

/** Repo contributors, bots and the core team removed. */
export async function fetchContributors(
  exclude: string[] = []
): Promise<Contributor[]> {
  try {
    const response = await fetch(
      'https://api.github.com/repos/chakra-ui/panda/contributors?per_page=100',
      { next: { revalidate: 86400 } }
    )
    if (!response.ok) return []

    const contributors: Contributor[] = await response.json()
    const skip = new Set(exclude.map(login => login.toLowerCase()))

    return contributors.filter(
      person =>
        !person.login.includes('[bot]') && !skip.has(person.login.toLowerCase())
    )
  } catch (error) {
    console.error('Failed to fetch contributors:', error)
    return []
  }
}
