import { lookItUpSync } from 'look-it-up'
import fs from 'fs-extra'
import { outdent } from 'outdent'

export async function updateGitIgnore(outdir: string) {
  const filepath = lookItUpSync('.gitignore')

  if (!filepath) return

  const txt = outdent`
  
  ## CSS Panda
  ${outdir}
  `

  const content = await fs.readFile(filepath)

  if (!content.includes(outdir)) {
    await fs.appendFile(filepath, txt)
  }
}
