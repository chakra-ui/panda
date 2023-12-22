import { colors, logger } from '@pandacss/logger'
import { writeFile } from 'fs/promises'
import * as path from 'path'
import type { PandaContext } from './create-context'
import { version } from '../package.json'

export async function shipFiles(ctx: PandaContext, outfile: string) {
  const files = ctx.getFiles()
  const filesWithCss = [] as string[]

  files.forEach(async (file) => {
    const result = ctx.project.parseSourceFile(file)
    if (!result || result.isEmpty() || ctx.hashFactory.isEmpty()) return

    filesWithCss.push(path.relative(ctx.config.cwd, file))
  })

  logger.info('cli', `Found ${colors.bold(`${filesWithCss.length}/${files.length}`)} files using Panda`)

  const minify = ctx.config.minify
  logger.info('cli', `Writing ${minify ? '[min] ' : ' '}${colors.bold(outfile)}`)

  const collector = ctx.collectStyles()
  const styles = {
    atomic: Array.from(collector.atomic).map(({ hash }) => hash),
    recipes: Object.fromEntries(
      Array.from(collector.recipes.entries()).map(([name, set]) => [name, Array.from(set).map(({ hash }) => hash)]),
    ),
  }
  const output = JSON.stringify(
    {
      schemaVersion: version,
      styles,
    },
    null,
    minify ? 0 : 2,
  )

  const dirname = ctx.runtime.path.dirname(outfile)
  ctx.runtime.fs.ensureDirSync(dirname)

  await writeFile(outfile, output)
  logger.info('cli', 'Done!')
}
