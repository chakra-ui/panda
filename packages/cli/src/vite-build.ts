import { execa } from 'execa'
import { join } from 'path'

export type BuildOpts = {
  outDir: string
}

export async function viteBuild({ outDir }: BuildOpts) {
  const astroPath = join(__dirname, '../node_modules/.bin/astro')
  const appPath = join(__dirname, '../docs-app')
  process.env.ASTRO_OUT_DIR = outDir
  const { stdout } = await execa(astroPath, ['build', '--root', appPath, '--outDir', outDir])
  console.log(stdout)
}
