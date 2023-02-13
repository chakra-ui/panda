import { logger, quote } from '@pandacss/logger'
import { messages } from '@pandacss/generator'
import { writeFile } from 'fs-extra'
import { lookItUpSync } from 'look-it-up'
import { outdent } from 'outdent'
import { join } from 'path'
import getPackageManager from 'preferred-pm'
import { findConfig } from './config'

export async function setupConfig(cwd: string, { force }: { force?: boolean }) {
  const configFile = findConfig()

  const pmResult = await getPackageManager(cwd)
  const pm = pmResult?.name ?? 'npm'
  const cmd = pm === 'npm' ? 'npm run' : pm

  const isTs = lookItUpSync('tsconfig.json', cwd)
  const file = isTs ? 'panda.config.ts' : 'panda.config.mjs'

  logger.info('init:config', `creating panda config file: ${quote(file)}`)

  if (!force && configFile) {
    logger.warn('init:config', messages.configExists(cmd))
  } else {
    const content = outdent`
       import { defineConfig } from "@pandacss/dev"

       export default defineConfig({
        // Whether to use css reset
        preflight: true,
        
        // Where to look for your css declarations
        include: ["./src/**/*.{tsx,jsx}", "./pages/**/*.{jsx,tsx}"],
        
        // Files to exclude
        exclude: [],
        
        // The output directory for your css system
        outdir: "styled-system",
       })
    `

    await writeFile(join(cwd, file), content)
    logger.log(messages.thankYou())
  }
}

export async function setupPostcss(cwd: string) {
  logger.info('init:postcss', `creating postcss config file: ${quote('postcss.config.cjs')}`)

  const content = outdent`
  module.exports = {
    plugins: {
      '@pandacss/dev/postcss': {},
    },
  }
  `

  await writeFile(join(cwd, 'postcss.config.cjs'), content)
}
