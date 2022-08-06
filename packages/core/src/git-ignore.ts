import { promises as fs } from 'fs'
import { findUp } from 'find-up'
import { warn } from '@css-panda/logger'

export async function updateGitIgnore({ cwd, path }: { cwd: string; path: string }) {
  // check if gitignore file exists
  const file = await findUp('gitignore', { cwd })

  if (!file) {
    warn('Cannot find .gitignore file')
    return
  }

  // check if .gitignore file contains .css-pandaignore
  const content = await fs.readFile(file, 'utf8')

  if (!content.includes(path)) {
    await fs.appendFile(file, `\n##Css Panda\r${path}`)
  }
}
