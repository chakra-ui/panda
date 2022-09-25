import { colors, logger, quote } from '@css-panda/logger'
import { writeFile } from 'fs-extra'
import { lookItUpSync } from 'look-it-up'
import { outdent } from 'outdent'
import { join } from 'path'
import getPackageManager from 'preferred-pm'
import { findConfig } from './load-config'

export async function setupConfig(_cwd?: string) {
  const cwd = _cwd ?? process.cwd()
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

       export default defineConfig({
        // where to look for your css declarations
        include: ["./src/**/*.{tsx,jsx}", "./pages/**/*.{jsx,tsx}"],
        // The output directory for system
        outdir: "panda",
        // Add your tokens here
        tokens: {},
        // Add your semantic tokens here
        semanticTokens: {},
        // Add your breakpoints here
        breakpoints: {
          sm: "480px",
          md: "768px",
          lg: "1024px",
          xl: "1280px",
          "2xl": "1536px",
        }
       })
    `

    await writeFile(join(cwd, file), content)

    logger.info(msg)
  }
}
