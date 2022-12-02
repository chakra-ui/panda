import { execa } from 'execa'
import path from 'path'

export const viteBundler = async () => {
  const astroPath = path.join(__dirname, '../node_modules/.bin/astro')
  const appPath = path.join(__dirname, '../docs-app')
  const result = execa(astroPath, ['dev', '--root', appPath], {
    stdio: 'inherit',
  })
  result.stdout?.pipe(process.stdout)
  result.stderr?.pipe(process.stderr)
}
