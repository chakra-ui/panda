import { colors, logger } from '@pandacss/logger'
import { execa } from 'execa'
import { join } from 'path'

export type BuildOpts = {
  outDir: string
}

const astroBin = join(__dirname, '../node_modules/.bin/astro')
const appPath = join(__dirname, '../app')

export async function buildDocs({ outDir }: BuildOpts) {
  process.env.ASTRO_OUT_DIR = outDir
  const { stdout } = await execa(astroBin, ['build', '--root', appPath])
  logger.log(stdout)
}

export async function serveDocs() {
  const result = execa(astroBin, ['dev', '--root', appPath], {
    stdio: 'inherit',
  })
  result.stdout?.pipe(process.stdout)
  result.stderr?.pipe(process.stderr)
}

export async function previewDocs({ outDir }: BuildOpts) {
  process.env.ASTRO_OUT_DIR = outDir
  const result = execa(astroBin, ['preview', '--root', appPath], {
    stdio: 'inherit',
  })
  result.stdout?.pipe(process.stdout)
  result.stderr?.pipe(process.stderr)
}

export function printUrls(options: { host: string; port: number; https: boolean }) {
  const protocol = options.https ? 'https' : 'http'
  const localUrl = `${protocol}://${options.host}:${options.port}`
  logger.log(`  ${colors.cyan('➜')}  ${colors.bold('Previewed at')}: ${colors.reset(colors.green(localUrl))} `)
}
