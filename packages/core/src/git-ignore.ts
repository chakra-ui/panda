import { lookItUpSync } from 'look-it-up'
import fs from 'fs-extra'
import { outdent } from 'outdent'
import type { Context } from './create-context'

export async function updateGitIgnore(ctx: Context) {
  const filepath = lookItUpSync('.gitignore')

  if (!filepath) return

  const txt = outdent`
  
  ## CSS Panda
  ${ctx.outdir}
  `

  const content = await fs.readFile(filepath)

  if (!content.includes(ctx.outdir)) {
    await fs.appendFile(filepath, txt)
  }
}
