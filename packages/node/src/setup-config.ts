import { messages } from '@pandacss/generator'
import { logger, quote } from '@pandacss/logger'
import type { Config } from '@pandacss/types'
import fsExtra from 'fs-extra'
import { lookItUpSync } from 'look-it-up'
import { outdent } from 'outdent'
import { join } from 'pathe'
import getPackageManager from 'preferred-pm'
import { findConfig } from './config'
import prettier from 'prettier'

type SetupOptions = Partial<Config> & {
  force?: boolean
}

export async function setupConfig(cwd: string, opts: SetupOptions = {}) {
  const { force, outExtension, jsxFramework, syntax } = opts

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
    ${outExtension ? `\n // The extension for the emitted JavaScript files\noutExtension: '${outExtension}',` : ''}
    // Where to look for your css declarations
    include: ["./src/**/*.{js,jsx,ts,tsx}", "./pages/**/*.{js,jsx,ts,tsx}"],

    // Files to exclude
    exclude: [],

    // Useful for theme customization
    theme: {
      extend: {}
    },

    // The output directory for your css system
    outdir: "styled-system",
    ${jsxFramework ? `\n // The JSX framework to use\njsxFramework: '${jsxFramework}',` : ''}
    ${syntax ? `\n // The CSS Syntax to use to use\nsyntax: '${syntax}'` : ''}
})
    `

    await fsExtra.writeFile(join(cwd, file), prettier.format(content))
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

  await fsExtra.writeFile(join(cwd, 'postcss.config.cjs'), content)
}
