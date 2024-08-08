import { findConfig } from '@pandacss/config'
import { messages } from '@pandacss/core'
import { logger, quote } from '@pandacss/logger'
import { PandaError } from '@pandacss/shared'
import type { Config } from '@pandacss/types'
import fsExtra from 'fs-extra'
import { lookItUpSync } from 'look-it-up'
import { outdent } from 'outdent'
import { join } from 'path'
import { detect } from 'package-manager-detector'
import prettier from 'prettier'

type SetupOptions = Partial<Config> & {
  force?: boolean
}

export async function setupConfig(cwd: string, opts: SetupOptions = {}) {
  const { force, outExtension, jsxFramework, syntax, outdir = 'styled-system' } = opts

  let configFile: string | undefined

  try {
    configFile = findConfig({ cwd })
  } catch (err) {
    // ignore config not found error
    if (!(err instanceof PandaError)) {
      throw err
    }
  }

  const pmResult = await detect({ cwd })
  const pm = (pmResult?.agent ?? 'npm').split('@')[0]
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
    outdir: ${JSON.stringify(outdir)},
    ${jsxFramework ? `\n // The JSX framework to use\njsxFramework: '${jsxFramework}',` : ''}
    ${syntax ? `\n // The CSS Syntax to use to use\nsyntax: '${syntax}'` : ''}
})
    `

    await fsExtra.writeFile(join(cwd, file), await prettier.format(content, { parser: 'babel' }))
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
