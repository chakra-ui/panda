import { findUp } from '@css-panda/shared'
import fs from 'fs-extra'
import { outdent } from 'outdent'
import type { InternalContext } from './create-context'

export async function updateGitIgnore(ctx: InternalContext) {
  const [gitIgnorePath] = findUp(['.gitignore'])

  const _content = outdent`
  
  ## CSS Panda
  ${ctx.outdir}
  `

  if (gitIgnorePath) {
    //
    const content = await fs.readFile(gitIgnorePath)

    if (!content.includes(ctx.outdir)) {
      await fs.appendFile(gitIgnorePath, _content)
    }
  }
}
