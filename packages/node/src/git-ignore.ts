import { appendFileSync, readFileSync, writeFileSync } from 'fs'
import { lookItUpSync } from 'look-it-up'
import outdent from 'outdent'
import type { PandaContext } from './create-context'

export function setupGitIgnore({ config: { outdir } }: PandaContext) {
  const txt = outdent`## Panda
  ${outdir}
  ${outdir}-static
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
