import { execa } from 'execa'
import path from 'path'

export const viteBundler = async () => {
  const astroPath = path.join(__dirname, '../node_modules/.bin/astro')
  const appPath = path.join(__dirname, '../docs-app')
  execa(astroPath, ['dev', '--root', appPath]).stdout?.pipe(process.stdout)
}
