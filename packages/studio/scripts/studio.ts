import { colors, logger } from '@pandacss/logger'
import { execa } from 'execa'
import { join } from 'node:path'
import { createRequire } from 'node:module'

export type BuildOpts = {
  outDir: string
  configPath: string
}

const require = createRequire(import.meta.url)
const astroBin = require.resolve('astro')
const appPath = join(__dirname, '..')

export async function buildStudio({ outDir, configPath }: BuildOpts) {
  process.env.ASTRO_OUT_DIR = outDir
  const { stdout } = await execa(astroBin, ['build', '--root', appPath], {
    cwd: appPath,
    env: {
      PUBLIC_CONFIG_PATH: configPath,
    },
  })
  logger.log(stdout)
}

export async function serveStudio({ configPath }: BuildOpts) {
  const result = execa(astroBin, ['dev', '--root', appPath], {
    stdio: 'inherit',
    cwd: appPath,
    env: {
      PUBLIC_CONFIG_PATH: configPath,
    },
  })
  result.stdout?.pipe(process.stdout)
  result.stderr?.pipe(process.stderr)
}

export async function previewStudio({ outDir }: BuildOpts) {
  process.env.ASTRO_OUT_DIR = outDir
  const result = execa(astroBin, ['preview', '--root', appPath], {
    stdio: 'inherit',
    cwd: appPath,
  })
  result.stdout?.pipe(process.stdout)
  result.stderr?.pipe(process.stderr)
}

export function printUrls(options: { host: string; port: number; https: boolean }) {
  const protocol = options.https ? 'https' : 'http'
  const localUrl = `${protocol}://${options.host}:${options.port}`
  logger.log(`  ${colors.cyan('➜')}  ${colors.bold('Previewed at')}: ${colors.reset(colors.green(localUrl))} `)
}
