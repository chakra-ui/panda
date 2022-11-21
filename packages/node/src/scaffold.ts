import { logger, quote } from '@pandacss/logger'
import { writeFile } from 'fs-extra'
import { lookItUpSync } from 'look-it-up'
import { outdent } from 'outdent'
import { join } from 'path'
import getPackageManager from 'preferred-pm'
import { findConfig } from './config'
import { configExistsMessage, thankYouMessage } from './messages'

export async function setupConfig(cwd: string, { force }: { force?: boolean }) {
  const configFile = findConfig()

  const pmResult = await getPackageManager(cwd)
  const pm = pmResult?.name ?? 'npm'
  const cmd = pm === 'npm' ? 'npm run' : pm

  const isTs = lookItUpSync('tsconfig.json', cwd)
  const file = isTs ? 'panda.config.ts' : 'panda.config.mjs'

  logger.info({ type: 'init', msg: `creating panda config file: ${quote(file)}` })

  if (!force && configFile) {
    logger.warn('config exists', configExistsMessage(cmd))
  } else {
    const content = outdent`
       import { defineConfig } from "css-panda"
       import { utilities, breakpoints, conditions, keyframes, tokens, patterns } from "css-panda/presets"

       export default defineConfig({
        // whether to use css reset
        preflight: true,
        // where to look for your css declarations
        include: ["./src/**/*.{tsx,jsx}", "./pages/**/*.{jsx,tsx}"],
        // files to exclude
        exclude: [],
        // The output directory for system
        outdir: "design-system",
        // Add your css conditions here (&:hover, &:focus, etc)
        conditions,
        // Add your tokens here
        tokens,
        // Add your semantic tokens here
        semanticTokens: {},
        // Add your keyframes here (spin, fade, etc)
        keyframes,
        // Add your breakpoints here (sm, md, lg, xl)
        breakpoints,
        // Add your css property utilities here (mt, ml, etc)
        utilities,
        // Add your css patterns here (stack, grid, etc)
        patterns,
       })
    `

    await writeFile(join(cwd, file), content)
    logger.log(thankYouMessage())
  }
}

export async function setupPostcss(cwd: string) {
  logger.info({ type: 'init', msg: `creating postcss config file: ${quote('postcss.config.cjs')}` })

  const content = outdent`
  module.exports = {
    plugins: {
      'css-panda/postcss': {},
    },
  }
  `

  await writeFile(join(cwd, 'postcss.config.cjs'), content)
}
