import { docsConfig } from '@/docs.config'
import gitUrlParse from 'git-url-parse'

export const getGitEditUrl = (filePath = ''): string => {
  const repo = gitUrlParse(docsConfig.docsRepositoryBase || '')

  if (!repo) {
    throw new Error('Invalid `docsRepositoryBase` URL!')
  }

  return `${repo.href}/${filePath}`
}
