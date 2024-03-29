import { appendFileSync, readFileSync, writeFileSync } from 'fs'
import { lookItUpSync } from 'look-it-up'
import outdent from 'outdent'
import type { PandaContext } from './create-context'

export function setupGitIgnore(ctx: PandaContext) {
  const { outdir, gitignore } = ctx.config

  if (!gitignore) return

  const txt = outdent`
  
  ## Panda
  ${outdir}
  ${ctx.studio.outdir}
  `

  const file = lookItUpSync('.gitignore')

  if (!file) {
    return writeFileSync('.gitignore', txt)
  }

  const content = readFileSync(file, 'utf-8')

  if (!content.includes(outdir)) {
    appendFileSync(file, txt)
  }
}
