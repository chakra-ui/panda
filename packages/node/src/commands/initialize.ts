import { loadConfigFile } from '@css-panda/config'
import { ConfigNotFoundError } from '@css-panda/error'
import { colors, logger } from '@css-panda/logger'
import type { Config, UserConfig } from '@css-panda/types'
import fs from 'fs-extra'
import merge from 'lodash.merge'
import { outdent } from 'outdent'
import { createContext } from '../create-context'
import { generateSystem } from '../generators'
import { updateGitIgnore } from '../git-ignore'

export async function initialize(options: Config & { configPath?: string } = {}) {
  const { cwd = process.cwd(), configPath, ...rest } = options

  logger.info('Panda generator starting...')

  const conf = await loadConfigFile<UserConfig>({ root: cwd, file: configPath })
  merge(conf.config, { cwd, ...rest })

  logger.debug({ type: 'config:file', path: conf.path })

  if (!conf.config) {
    throw new ConfigNotFoundError({ cwd, path: conf.path })
  }

  const ctx = createContext(conf)

  logger.info('Panda context created...')

  if (conf.config.clean) {
    await fs.emptyDir(ctx.outdir)
  }

  await updateGitIgnore(ctx)

  await generateSystem(ctx, conf.code)

  logger.info('Generated system')

  logger.info(outdent`
  Thanks for choosing ${colors.green('Panda')} to write your CSS!
  
  You should be set up to start using panda now!

  We have added a \`${colors.bold(ctx.outdir)}\` folder, and a couple of files to help you out:

  - ${colors.blue(`\`${ctx.outdir}/design-tokens\``)} - contains all of your design tokens artifacts.
  - ${colors.blue(`\`${ctx.outdir}/css\``)} - the css system to create styles with.

  `)

  return ctx
}
