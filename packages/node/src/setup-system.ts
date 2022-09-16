import { minifyConfig } from '@css-panda/ast'
import type { LoadConfigResult } from '@css-panda/config'
import { logger, quote } from '@css-panda/logger'
import { emptyDir, ensureDir } from 'fs-extra'
import { outdent } from 'outdent'
import { createContext } from './create-context'
import { generateSystem } from './generators'
import { writeFileWithNote } from './generators/__utils'
import { updateGitIgnore } from './setup-gitignore'

export async function setupSystem(conf: LoadConfigResult) {
  const ctx = createContext(conf)

  logger.debug('Panda context created')

  if (conf.config.clean) {
    await emptyDir(ctx.outdir)
  }

  await ensureDir(ctx.outdir)

  await generateSystem(ctx)

  // prettier-ignore
  await Promise.all([
    updateGitIgnore(ctx.outdir),
    writeFileWithNote(ctx.paths.config, minifyConfig(conf.code))
  ])

  const msg = [
    outdent`
    We have generated the panda system for you:

    - ${quote(ctx.outdir, '/css')}: the css function to author styles
  `,
    ctx.hasTokens &&
      outdent`
    - ${quote(ctx.outdir, '/design-tokens')}: the css variables and js function to query your tokens
  `,
    ctx.hasRecipes &&
      outdent`
    - ${quote(ctx.outdir, '/patterns')}: functions to implement common css patterns
  `,
    ctx.hasPatterns &&
      outdent`
    - ${quote(ctx.outdir, '/recipes')}: functions to create multi-variant styles
  `,
  ].filter(Boolean)

  return { message: msg.join('\n') }
}
