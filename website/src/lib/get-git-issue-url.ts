import gitUrlParse from 'git-url-parse'

interface GetGitIssueUrlProps {
  repository?: string
  title: string
  labels?: string
}

export const getGitIssueUrl = (props: GetGitIssueUrlProps): string => {
  const { repository = '', title, labels } = props

  const repo = gitUrlParse(repository)

  if (!repo) {
    throw new Error('Invalid `docsRepositoryBase` URL!')
  }

  if (repo.resource.includes('gitlab')) {
    return `${repo.protocol}://${repo.resource}/${repo.owner}/${
      repo.name
    }/-/issues/new?issue[title]=${encodeURIComponent(title)}`
  }

  if (repo.resource.includes('github')) {
    return `${repo.protocol}://${repo.resource}/${repo.owner}/${
      repo.name
    }/issues/new?title=${encodeURIComponent(title)}&labels=${labels || ''}`
  }

  return '#'
}
