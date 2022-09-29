import { colors, logger, quote } from '@css-panda/logger'
import { writeFile } from 'fs-extra'
import { lookItUpSync } from 'look-it-up'
import { outdent } from 'outdent'
import { join } from 'path'
import getPackageManager from 'preferred-pm'
import { findConfig } from './config'

export async function setupConfig(cwd: string) {
  const configFile = findConfig()

  const pmResult = await getPackageManager(cwd)
  const pm = pmResult?.name ?? 'npm'
  const cmd = pm === 'npm' ? 'npm run' : pm

  const isTs = lookItUpSync('tsconfig.json', cwd)

  if (configFile) {
    logger.warn(
      'config exists',
      outdent`
      \n
      It looks like you already have panda initialized in \`panda.config${configFile}\`.
      
      You can now run ${quote(cmd, ' panda --watch')}.

      `,
    )
  } else {
    const file = isTs ? 'panda.config.ts' : 'panda.config.mjs'

    const msg = outdent`
    Thanks for choosing ${colors.cyan('Panda')} to write your css.

    You are set up to start using Panda 🥰!    
    `

    const content = outdent`
       import { defineConfig } from "css-panda"
       import { utilities, patterns, breakpoints, conditions, keyframes } from "css-panda/presets"

       export default defineConfig({
        // where to look for your css declarations
        include: ["./src/**/*.{tsx,jsx}", "./pages/**/*.{jsx,tsx}"],
        // files to exclude
        exclude: [],
        // The output directory for system
        outdir: "panda",
        // Add your css conditions here (&:hover, &:focus, etc)
        conditions,
        // Add your tokens here
        tokens: {},
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

    logger.info(msg)
  }
}

export async function setupPostcss(cwd: string) {
  const content = outdent`
  module.exports = {
    plugins: {
      'css-panda/postcss': {},
    },
  }
  `

  await writeFile(join(cwd, 'postcss.config.cjs'), content)
}
