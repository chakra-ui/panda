import { loadConfigFile } from '@css-panda/config'
import { ConfigNotFoundError } from '@css-panda/error'
import { logger } from '@css-panda/logger'
import type { Config, UserConfig } from '@css-panda/types'
import fs from 'fs-extra'
import merge from 'lodash.merge'
import { outdent } from 'outdent'
import { Context, createContext } from '../create-context'
import { generateSystem } from '../generators'
import { updateGitIgnore } from '../git-ignore'

function validateContext(ctx: Context) {
  if (!ctx.config.include) {
    throw new Error(outdent`
    You are missing the required property: "include".
    Please add it to your config file.

    ---

    import { defineConfig } from "css-panda";

    defineConfig({
      include: ['*.jsx'],
    })
    
    ---

    `)
  }
}

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
  validateContext(ctx)

  logger.info('Panda context created...')

  if (conf.config.clean) {
    await fs.emptyDir(ctx.outdir)
  }

  await updateGitIgnore(ctx)

  await generateSystem(ctx, conf.code)

  logger.info('Generated system')

  return ctx
}
